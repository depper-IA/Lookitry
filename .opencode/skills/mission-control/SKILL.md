---
name: mission-control
description: Centralized mission control for monitoring and coordinating all Lookitry sub-agents (WebWizard, DevGuardian, DataAlchemist, GrowthPilot, ArchitectAI). Use when the user asks for a "dashboard", "mission control", "control center", "agent status", "monitor all agents", "coordination panel", or wants to check the status of all agents, delegate tasks to specific agents, or get an overview of the entire Lookitry project. This skill is the nerve center for orchestrating the Lookitry SaaS project.
---

# Mission Control — Lookitry Agent Orchestration Hub

## Overview

Mission Control is your centralized dashboard for monitoring, coordinating, and delegating to all Lookitry sub-agents. Think of it as the flight control tower for the entire project.

## Agent Roster

| Agent | Specialty | Workspace |
|-------|-----------|-----------|
| **WebWizard** | Frontend (Next.js 14, Tailwind, Framer Motion) | `/home/travis/.openclaw/workspaces/webwizard` |
| **DevGuardian** | QA & Security (Vitest, Jest, audits) | `/home/travis/.openclaw/workspaces/devguardian` |
| **DataAlchemist** | Backend & Automation (Supabase, MinIO, n8n) | `/home/travis/.openclaw/workspaces/dataalchemist` |
| **GrowthPilot** | Sales & CRM (Brevo, WooCommerce, referidos) | `/home/travis/.openclaw/workspaces/growthpilot` |
| **ArchitectAI** | DevOps & Hardware (Docker, Traefik, VPS) | `/home/travis/.openclaw/workspaces/architectai` |

## Quick Status Commands

### Check All Agent Sessions
```
sessions_list(messageLimit=3)
```
Shows active sessions for all agents with recent message previews.

### Spawn a Specific Agent
```
sessions_spawn(runtime="subagent", mode="session", task="<task description>")
```

### Kill/Steer Active Agents
```
subagents(action="list")
subagents(action="kill", target="<session-key>")
subagents(action="steer", message="<instruction>", target="<session-key>")
```

## Project Structure Reference

```
/home/travis/Lookitry/Lookitry/
├── frontend/          # Next.js 14 app (src/app/, components/, etc.)
├── backend/           # Express API (src/routes/, src/controllers/, etc.)
├── brain/             # Lookitry Brain Vault (AI/ML resources)
├── lookitry-woocommerce/  # WooCommerce plugin
├── supabase/          # DB migrations & schema
├── sammy/             # This orchestrator agent
└── scripts/           # Deployment & utility scripts
```

## Deployment Status

Check VPS health:
```
pm2 status (on VPS via SSH)
docker ps (running containers)
```

Key services on VPS:
- **lookitry-frontend**: `https://lookitry.com`
- **lookitry-backend**: `https://api.lookitry.com`
- **lookitry-sammy**: OpenClaw orchestrator
- **Traefik**: Reverse proxy on ports 80/443
- **MinIO**: S3-compatible storage

## Delegation Patterns

### For Frontend Tasks → WebWizard
```
sessions_spawn(
  runtime="subagent",
  label="webwizard",
  mode="session",
  task="<frontend task>"
)
```

### For Testing/Audits → DevGuardian
```
sessions_spawn(
  runtime="subagent",
  label="devguardian",
  mode="session",
  task="<testing/audit task>"
)
```

### For Backend/Data Tasks → DataAlchemist
```
sessions_spawn(
  runtime="subagent",
  label="dataalchemist",
  mode="session",
  task="<backend/data task>"
)
```

### For Sales/CRM Tasks → GrowthPilot
```
sessions_spawn(
  runtime="subagent",
  label="growthpilot",
  mode="session",
  task="<sales/crm task>"
)
```

### For DevOps/Hardware Tasks → ArchitectAI
```
sessions_spawn(
  runtime="subagent",
  label="architectai",
  mode="session",
  task="<devops/infrastructure task>"
)
```

## Health Check Indicators

✅ **Healthy**: All services running, tests green, no errors
⚠️ **Degraded**: Some services down or tests failing
🔴 **Critical**: Major outage or security issue detected

## Critical Files to Monitor

- `/.openclaw/openclaw.json` — Gateway config
- `/Lookitry/lookitry-frontend/` — Frontend codebase
- `/Lookitry/lookitry-backend/` — Backend codebase
- `/Lookitry/supabase/supabase-schema.sql` — Database schema
- `/Lookitry/docker-compose.*.yml` — Container configs
