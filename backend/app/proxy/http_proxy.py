"""HTTP proxy with verdict routing."""
import asyncio
import os
import json
import logging

import httpx
from app.core.db import get_conn
from app.verdict.engine import verdict_engine

logger = logging.getLogger(__name__)

REAL_BACKEND = os.getenv("REAL_BACKEND_URL", "http://host.docker.internal:8081")
PROXY_PORT = int(os.getenv("HTTP_PROXY_PORT", "8090"))
HOSTILE_THRESHOLD = 50

HONEYPOT_HTML = b"""<!DOCTYPE html>
<html><head><title>403 Forbidden</title></head>
<body><h1>403 Forbidden</h1><p>Access denied.</p></body></html>"""


async def get_or_create_session(client_ip: str) -> int:
    """Get or create session for IP, return session_id."""
    async with get_conn() as db:
        row = await db.fetchrow(
            "SELECT id FROM sessions WHERE source_ip = $1 ORDER BY started_at DESC LIMIT 1",
            client_ip
        )
        if row:
            return row["id"]
        row = await db.fetchrow(
            "INSERT INTO sessions (source_ip, protocol, started_at) VALUES ($1, 'http', NOW()) RETURNING id",
            client_ip
        )
        return row["id"]


async def log_event(session_id: int, event_type: str, data: dict):
    """Log HTTP request to events table."""
    async with get_conn() as db:
        await db.execute("""
            INSERT INTO events (session_id, event_type, data, score_delta, ts)
            VALUES ($1, $2, $3, 0, NOW())
        """, session_id, event_type, json.dumps(data))


async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    """Handle incoming HTTP connection."""
    try:
        client_ip = writer.get_extra_info('peername')[0] if writer.get_extra_info('peername') else "unknown"
        
        # Read HTTP request
        request_data = await reader.read(8192)
        if not request_data:
            writer.close()
            await writer.wait_closed()
            return
            
        request_text = request_data.decode('utf-8', errors='ignore')
        lines = request_text.split('\\r\\n')
        
        if not lines:
            writer.close()
            await writer.wait_closed()
            return
            
        # Parse request line
        parts = lines[0].split()
        if len(parts) < 2:
            writer.close()
            await writer.wait_closed()
            return
            
        method, path = parts[0], parts[1]
        
        # Get session and score
        session_id = await get_or_create_session(client_ip)
        score = await verdict_engine.score_event(session_id, "http_request")
        
        # Log the event
        await log_event(session_id, "http_request", {
            "method": method,
            "path": path,
            "client_ip": client_ip,
            "score": score
        })
        
        logger.info(f"HTTP {method} {path} from {client_ip}: score={score}")
        
        if score >= HOSTILE_THRESHOLD:
            # Hostile - return honeypot (proper HTTP response)
            body = HONEYPOT_HTML
            headers = (
                f"HTTP/1.1 403 Forbidden\r\n"
                f"Content-Type: text/html\r\n"
                f"Content-Length: {len(body)}\r\n"
                f"Connection: close\r\n"
                f"\r\n"
            )
            writer.write(headers.encode() + body)
            await writer.drain()
        else:
            # Cleared - proxy to real backend
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.request(
                        method=method,
                        url=f"{REAL_BACKEND}{path}",
                        headers={"X-Forwarded-For": client_ip, "X-Real-IP": client_ip}
                    )
                    body = resp.content
                    headers = (
                        f"HTTP/1.1 {resp.status_code}\r\n"
                        f"Content-Length: {len(body)}\r\n"
                        f"Connection: close\r\n"
                        f"\r\n"
                    )
                    writer.write(headers.encode() + body)
                    await writer.drain()
            except Exception as e:
                logger.error(f"Proxy error: {e}")
                # Fallback - return honeypot
                body = HONEYPOT_HTML
                headers = (
                    f"HTTP/1.1 403 Forbidden\r\n"
                    f"Content-Type: text/html\r\n"
                    f"Content-Length: {len(body)}\r\n"
                    f"Connection: close\r\n"
                    f"\r\n"
                )
                writer.write(headers.encode() + body)
                await writer.drain()
                
    except Exception as e:
        logger.error(f"Handler error: {e}")
    finally:
        try:
            writer.close()
            await writer.wait_closed()
        except:
            pass


async def start_http_proxy():
    """Start HTTP proxy server."""
    server = await asyncio.start_server(handle_client, '0.0.0.0', PROXY_PORT)
    logger.info(f"HTTP proxy listening on port {PROXY_PORT}")
    
    async with server:
        await server.serve_forever()
