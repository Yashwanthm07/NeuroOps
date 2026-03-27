#!/bin/bash

# NeuroOps Setup Script

set -e

echo "🧠 NeuroOps Setup"
echo "=================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not installed"
    exit 1
fi

echo "✓ Docker found: $(docker --version)"
echo "✓ Docker Compose found: $(docker-compose --version)"

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example"
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
    echo "⚠️  Especially: CLAUDE_API_KEY"
fi

# Create volumes
echo "📦 Creating volumes..."
mkdir -p postgres_data redis_data prometheus_data loki_data grafana_data

# Build and start services
echo "🚀 Starting services..."
docker-compose up -d --build

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T postgres psql -U neuro_admin -d neuro_ops -f /docker-entrypoint-initdb.d/001_init_schema.sql

# Verify health
echo "✅ Verifying services..."
curl -s http://localhost:3001/health | grep -q "healthy" && echo "✓ Backend API healthy" || echo "✗ Backend API not responding"

# Print summary
echo ""
echo "✨ NeuroOps is running!"
echo ""
echo "📊 Access points:"
echo "  Frontend:   http://localhost:3000"
echo "  API:        http://localhost:3001"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana:    http://localhost:3002 (admin/admin)"
echo "  Jaeger:     http://localhost:16686"
echo "  Loki:       http://localhost:3100"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📋 To view logs: docker-compose logs -f backend"
