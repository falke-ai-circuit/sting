import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)

class NukeExecutor:
    """Executes NUKE verdict by blocking attacker IPs via iptables."""
    
    def __init__(self):
        self._banned_ips: Dict[str, datetime] = {}
    
    async def execute_nuke(self, session_id: str, source_ip: str) -> dict:
        """
        Execute NUKE verdict:
        1. Add iptables DROP rule for source IP
        2. Log the action
        3. Return execution result
        """
        logger.warning(f"[NUKE] Executing ban for session {session_id}, IP {source_ip}")
        
        result = {
            "session_id": session_id,
            "source_ip": source_ip,
            "action": "NUKE",
            "iptables_success": False,
            "timestamp": datetime.utcnow().isoformat(),
            "error": None
        }
        
        # Validate IP format (basic check)
        if not source_ip or source_ip == "unknown":
            result["error"] = "Invalid source IP"
            logger.error(f"[NUKE] Cannot ban invalid IP: {source_ip}")
            return result
        
        # Check if already banned
        if source_ip in self._banned_ips:
            result["already_banned"] = True
            result["banned_at"] = self._banned_ips[source_ip].isoformat()
            logger.info(f"[NUKE] IP {source_ip} already banned")
            return result
        
        # Execute iptables command
        cmd = ["iptables", "-I", "INPUT", "-s", source_ip, "-j", "DROP"]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10.0)
            
            if proc.returncode == 0:
                self._banned_ips[source_ip] = datetime.utcnow()
                result["iptables_success"] = True
                logger.warning(f"[NUKE] Successfully banned IP {source_ip} via iptables")
            else:
                stderr_str = stderr.decode().strip() if stderr else "Unknown error"
                result["error"] = f"iptables failed: {stderr_str}"
                logger.error(f"[NUKE] iptables failed for {source_ip}: {stderr_str}")
                
        except asyncio.TimeoutError:
            result["error"] = "iptables command timed out"
            logger.error(f"[NUKE] iptables command timed out for {source_ip}")
        except Exception as e:
            result["error"] = f"Exception: {str(e)}"
            logger.error(f"[NUKE] Exception while banning {source_ip}: {e}")
        
        return result
    
    def is_banned(self, source_ip: str) -> bool:
        """Check if an IP is already banned."""
        return source_ip in self._banned_ips
    
    def get_banned_ips(self) -> List[dict]:
        """Return list of all banned IPs with timestamps."""
        return [
            {"ip": ip, "banned_at": ts.isoformat()}
            for ip, ts in self._banned_ips.items()
        ]
    
    async def unban_ip(self, source_ip: str) -> bool:
        """Remove iptables ban for an IP (for admin use)."""
        if source_ip not in self._banned_ips:
            return False
        
        cmd = ["iptables", "-D", "INPUT", "-s", source_ip, "-j", "DROP"]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await asyncio.wait_for(proc.communicate(), timeout=10.0)
            
            if proc.returncode == 0:
                del self._banned_ips[source_ip]
                logger.info(f"[NUKE] Unbanned IP {source_ip}")
                return True
            else:
                logger.error(f"[NUKE] Failed to unban {source_ip}")
                return False
                
        except Exception as e:
            logger.error(f"[NUKE] Exception while unbanning {source_ip}: {e}")
            return False

# Global instance
nuke_executor = NukeExecutor()
