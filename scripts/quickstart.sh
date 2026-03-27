#!/usr/bin/env bash

# Quick Start - NeuroOps Platform

set -e

echo "
╔══════════════════════════════════════════════════════════════╗
║          🧠 NeuroOps Causal AI Observability Platform        ║
║                    Quick Start Guide v2.5                    ║
╚══════════════════════════════════════════════════════════════╝
"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker & Docker Compose found${NC}"

# Setup environment
echo -e "\n${BLUE}⚙️  Setting up environment...${NC}"

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env from .env.example${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Update CLAUDE_API_KEY in .env before running${NC}"
fi

# Start services
echo -e "\n${BLUE}🚀 Starting all services (this may take 30-60 seconds)...${NC}"
docker-compose up -d --build 2>/dev/null || true

# Wait for services
echo -e "${YELLOW}⏳ Waiting for services to initialize...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health &> /dev/null; then
        echo -e "${GREEN}✓ Backend healthy${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Verify all services
echo -e "\n${BLUE}🔍 Verifying services...${NC}"

services=(
    "http://localhost:3000:Frontend"
    "http://localhost:3001:Backend API"
    "http://localhost:5432:PostgreSQL (backend)"
    "http://localhost:6379:Redis (backend)"
    "http://localhost:9090:Prometheus"
    "http://localhost:3002:Grafana"
    "http://localhost:16686:Jaeger"
    "http://localhost:3100:Loki"
)

for service in "${services[@]}"; do
    IFS=':' read -r url name <<< "$service"
    if curl -s "$url/health" &> /dev/null || curl -s "$url" &> /dev/null; then
        echo -e "${GREEN}✓ $name${NC}"
    else
        echo -e "${YELLOW}⏳ $name (initializing...)${NC}"
    fi
done

# Print access points
echo -e "\n${BLUE}📊 Access Points:${NC}"
echo -e "  ${GREEN}Frontend${NC}    → ${BLUE}http://localhost:3000${NC}"
echo -e "  ${GREEN}API${NC}         → ${BLUE}http://localhost:3001${NC}"
echo -e "  ${GREEN}Prometheus${NC}  → ${BLUE}http://localhost:9090${NC}"
echo -e "  ${GREEN}Grafana${NC}     → ${BLUE}http://localhost:3002${NC} (admin/admin)"
echo -e "  ${GREEN}Jaeger${NC}      → ${BLUE}http://localhost:16686${NC}"
echo -e "  ${GREEN}Loki${NC}        → ${BLUE}http://localhost:3100${NC}"

# Print next steps
echo -e "\n${BLUE}📝 Next Steps:${NC}"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Click a fault injection scenario to trigger an incident"
echo "  3. Watch the incident lifecycle:"
echo "     • Injection → Detection → Attribution → Remediation → Learning → Resolved"
echo "  4. View the playbook modal for root cause analysis"
echo ""

# Print useful commands
echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo "  View logs:"
echo "    ${YELLOW}docker-compose logs -f backend${NC}"
echo ""
echo "  API test:"
echo "    ${YELLOW}curl http://localhost:3001/health${NC}"
echo ""
echo "  Database access:"
echo "    ${YELLOW}docker-compose exec postgres psql -U neuro_admin -d neuro_ops${NC}"
echo ""
echo "  Stop all services:"
echo "    ${YELLOW}docker-compose down${NC}"
echo ""

# Print API examples
echo -e "${BLUE}🔌 API Examples:${NC}"
echo ""
echo "  Get all incidents:"
echo "    ${YELLOW}curl http://localhost:3001/api/incidents${NC}"
echo ""
echo "  Get services:"
echo "    ${YELLOW}curl http://localhost:3001/api/services${NC}"
echo ""
echo "  Get logs:"
echo "    ${YELLOW}curl http://localhost:3001/api/logs?limit=10${NC}"
echo ""

# Final message
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ NeuroOps is ready! Open http://localhost:3000${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
