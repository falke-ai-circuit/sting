"""Lab job executor - processes queued jobs."""
import asyncio
import logging
from app.core.db import get_conn

logger = logging.getLogger(__name__)

async def lab_worker_loop():
    """Polls lab_jobs for status=queued, executes, updates status."""
    logger.info("Lab executor worker started")
    
    while True:
        try:
            async with get_conn() as db:
                # Get queued job
                row = await db.fetchrow("SELECT id, sample_id FROM lab_jobs WHERE status = 'queued' ORDER BY created_at LIMIT 1")
                
                if row:
                    job_id = row["id"]
                    sample_id = row["sample_id"]
                    
                    # Mark as running
                    await db.execute("UPDATE lab_jobs SET status = 'running' WHERE id = $1", job_id)
                    logger.info(f"Processing lab job {job_id} (sample_id={sample_id})")
                    
                    # Execute in isolated container
                    cmd = f"docker run --rm --network=none --memory=256m --cpus=0.5 alpine sh -c 'echo JOB {job_id} RUN; id; ls /' 2>&1"
                    proc = await asyncio.create_subprocess_shell(
                        cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    stdout, stderr = await proc.communicate()
                    
                    output = stdout.decode() if stdout else ""
                    error = stderr.decode() if stderr else ""
                    
                    # Update status
                    await db.execute("UPDATE lab_jobs SET status = 'complete', output = $1, error = $2 WHERE id = $3", output, error, job_id)
                    logger.info(f"Lab job {job_id} complete")
                    
        except Exception as e:
            logger.error(f"Lab worker error: {e}")
        
        await asyncio.sleep(5)
