import os
import aiohttp
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class TelegramAlerter:
    def __init__(self):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "7947899549")
        self.enabled = bool(self.bot_token)
        
        if self.enabled:
            logger.info(f"Telegram alerter initialized for chat {self.chat_id}")
        else:
            logger.warning("Telegram bot token not set, alerts disabled")
    
    async def send_nuke_alert(
        self,
        session_id: str,
        src_ip: str,
        request_count: int,
        first_seen: str,
        verdict: str = "NUKE"
    ):
        if not self.enabled:
            logger.warning("Telegram alerts disabled, skipping NUKE alert")
            return False
        
        message = f"""🔴 <b>STING NUKE ALERT</b>

<b>Session:</b> <code>{session_id[:16]}...</code>
<b>Source IP:</b> <code>{src_ip}</code>
<b>Verdict:</b> <b>{verdict}</b>
<b>Requests:</b> {request_count}
<b>First Seen:</b> {first_seen}

Connection dropped. Session terminated."""

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        logger.info(f"Telegram NUKE alert sent for session {session_id}")
                        return True
                    else:
                        text = await response.text()
                        logger.error(f"Telegram API error: {response.status} - {text}")
                        return False
        except asyncio.TimeoutError:
            logger.error("Telegram alert timeout")
            return False
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")
            return False

telegram_alerter = TelegramAlerter()
