# Quick Start Guide — Multi-Agent Framework for Vibe Coding

## How to Use This Framework

### Option A: Full Orchestration (Recommended for complex projects)

1. Open a new chat with your AI assistant
2. Paste the **Orchestrator Agent prompt** (from `prompts/00-orchestrator.md`)
3. Describe what you want to build
4. The Orchestrator will guide you through all phases

### Option B: Individual Agents (For specific tasks)

Pick the agent you need and paste its system prompt from the master document:

| I need to... | Use Agent |
|---|---|
| Define what to build | 02-Requirements Architect |
| Design the database/domain model | 05-Data Architect |
| Design APIs | 06-Integration Architect |
| Set up auth/permissions | 09-IAM Agent |
| Write business logic | 12-Domain Logic Agent |
| Build the frontend | 15-Frontend Architect + 16-UI Builder |
| Write tests | 17-Test Architect + 18-Test Implementation |
| Review code for security | 20-SAST Agent |
| Set up CI/CD | 21-CI/CD Agent |

### Option C: Security Review Only

For existing code, use agents 08 + 11 + 19 + 20 in sequence:
1. Security Architect → threat model your system
2. Threat Intelligence → find attack surfaces
3. Code Review → check architecture compliance
4. SAST → scan for OWASP Top 10

## Tips for Best Results

1. **Start with requirements** — Even for vibe coding, spending 5 minutes on requirements saves hours of rework
2. **Always include the IAM agent** — Auth is where most projects get hacked
3. **Use the Security Architect early** — It's cheaper to design security in than bolt it on
4. **Feed artifacts forward** — Each agent's output is the next agent's input
5. **Don't skip gates** — If a gate fails, fix it before moving on

## Example Prompt to Start

```
[Paste Orchestrator system prompt]

Build me a task management API with:
- User registration and login
- Teams that can have multiple users
- Tasks assigned to users within teams
- Role-based access (admin, member, viewer)
- REST API
- PostgreSQL database
- Deploy with Docker
```

The Orchestrator will then invoke each agent in order, building the complete system.

## File Structure

```
framework/
├── QUICKSTART.md                    ← You are here
├── multi-agent-framework.md         ← Complete framework with all 24 prompts
└── prompts/
    └── 00-orchestrator.md           ← Main entry point prompt
```
