# FALKE-STING — AKIS Framework v8.0
> Malware traffic analysis + threat intelligence platform — Python FastAPI + Vue/React frontend

## Project Overview
FALKE-STING is a network traffic analysis platform for malware detection, threat hunting, and behavioral analysis.
Full rebuild of STING 2.0 — all API modules, React frontend, docker-compose deployment.

## Stack
- Backend: Python FastAPI, asyncssh, SQLite/PostgreSQL
- Frontend: React (to be scaffolded in src/)
- SSH proxy: custom asyncssh-based relay
- Port: backend :8000, frontend :3000

## Project Structure
```
falke-sting/
├── backend/           # FastAPI app
│   ├── app/           # main app + routers
│   └── requirements.txt
├── src/               # frontend (React scaffold)
├── sting/             # SSH proxy + core engine
├── docker-compose.yml
└── CLAUDE.md          # This file
```

## Current Status
Phase 2: Backend wired (commit 253078c). Frontend not yet built. Docker-compose needs fixing.

## Key Commands
```bash
cd /root/dev/falke-sting
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
# Check docker
docker compose up -d
# Run tests
cd backend && python -m pytest tests/
```

## Architecture
- SSH proxy intercepts and routes traffic
- Parser analyzes packet/session data
- Analyzer classifies threats
- Alerter sends notifications
- Storage persists findings

## AKIS Rules
1. Always test after every change
2. Commit after each working feature
3. Docker-compose must start clean
4. All API endpoints must have tests
5. Frontend scaffold must match backend API contract
