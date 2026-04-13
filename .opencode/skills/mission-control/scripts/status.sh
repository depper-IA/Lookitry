#!/bin/bash
# Mission Control Status Checker
# Usage: ./status.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}     MISSION CONTROL — LOOKITRY STATUS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# Agent workspaces
echo -e "${BLUE}─── Agent Workspaces ───${NC}"
echo -e "WebWizard:    ${GREEN}✓${NC} $([ -d /home/travis/.openclaw/workspaces/webwizard ] && echo 'Configured' || echo "${RED}✗${NC} Missing")"
echo -e "DevGuardian:  ${GREEN}✓${NC} $([ -d /home/travis/.openclaw/workspaces/devguardian ] && echo 'Configured' || echo "${RED}✗${NC} Missing")"
echo -e "DataAlchemist:${GREEN}✓${NC} $([ -d /home/travis/.openclaw/workspaces/dataalchemist ] && echo 'Configured' || echo "${RED}✗${NC} Missing")"
echo -e "GrowthPilot:  ${GREEN}✓${NC} $([ -d /home/travis/.openclaw/workspaces/growthpilot ] && echo 'Configured' || echo "${RED}✗${NC} Missing")"
echo -e "ArchitectAI:  ${GREEN}✓${NC} $([ -d /home/travis/.openclaw/workspaces/architectai ] && echo 'Configured' || echo "${RED}✗${NC} Missing")"
echo ""

# OpenClaw Gateway
echo -e "${BLUE}─── OpenClaw Gateway ───${NC}"
if pgrep -f "openclaw-gateway" > /dev/null 2>&1; then
    echo -e "Gateway:      ${GREEN}✓ Running${NC}"
else
    echo -e "Gateway:      ${RED}✗ Not Running${NC}"
fi
echo ""

# Project files
echo -e "${BLUE}─── Project Structure ───${NC}"
echo -n "Frontend:     "; [ -d /home/travis/Lookitry/Lookitry/frontend ] && echo -e "${GREEN}✓${NC} Found" || echo -e "${RED}✗${NC} Missing"
echo -n "Backend:     "; [ -d /home/travis/Lookitry/Lookitry/backend ] && echo -e "${GREEN}✓${NC} Found" || echo -e "${RED}✗${NC} Missing"
echo -n "WooCommerce: "; [ -d /home/travis/Lookitry/Lookitry/lookitry-woocommerce ] && echo -e "${GREEN}✓${NC} Found" || echo -e "${RED}✗${NC} Missing"
echo -n "Brain:       "; [ -d /home/travis/Lookitry/Lookitry/brain ] && echo -e "${GREEN}✓${NC} Found" || echo -e "${RED}✗${NC} Missing"
echo -n "Supabase:    "; [ -d /home/travis/Lookitry/Lookitry/supabase ] && echo -e "${GREEN}✓${NC} Found" || echo -e "${RED}✗${NC} Missing"
echo ""

# Docker containers (if docker available)
echo -e "${BLUE}─── Docker Containers ───${NC}"
if command -v docker &> /dev/null 2>&1; then
    containers=$(docker ps --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "Cannot access docker")
    if [ "$containers" != "Cannot access docker" ]; then
        echo "$containers" | while read line; do
            name=$(echo "$line" | cut -d: -f1)
            status=$(echo "$line" | cut -d: -f2-)
            if echo "$status" | grep -q "Up"; then
                echo -e "  ${GREEN}✓${NC} $name: $status"
            else
                echo -e "  ${RED}✗${NC} $name: $status"
            fi
        done
    else
        echo -e "  ${YELLOW}⚠${NC} $containers"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Docker not available locally"
fi
echo ""

# Recent commits
echo -e "${BLUE}─── Recent Commits ───${NC}"
cd /home/travis/Lookitry/Lookitry
git log --oneline -5 2>/dev/null || echo "Not a git repo"
echo ""

# Pending changes
echo -e "${BLUE}─── Git Status ───${NC}"
cd /home/travis/Lookitry/Lookitry
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Changes pending${NC}"
    git status --short | head -10
else
    echo -e "${GREEN}✓ Working tree clean${NC}"
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}     END MISSION CONTROL STATUS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
