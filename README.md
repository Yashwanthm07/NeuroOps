# NeuroOps — Causal AI Observability Platform

> Autonomous incident detection, root cause analysis, and remediation for microservices using causal inference, anomaly detection, and Claude AI.

## 🧠 Overview

NeuroOps is an end-to-end observability platform that combines:

- **LogBERT** - Anomaly detection on log embeddings
- **LSTM-TCN** - Time-series metric degradation detection
- **PC-Algorithm** - Causal graph construction for dependency inference
- **Claude AI** - Natural language RCA and remediation planning
- **Prometheus + Loki + Jaeger** - Observability stack integration
- **Docker Compose** - Full local development environment

### Key Features

✅ **Autonomous Incident Detection** - AI-powered anomaly scoring across metrics and logs  
✅ **Causal Attribution** - Graph-based root cause identification  
✅ **Auto-Remediation** - Playbook generation and execution  
✅ **Real-time Visualization** - Dependency graph and incident lifecycle  
✅ **SLO Tracking** - 15s remediation SLO with confidence metrics  
✅ **Multi-stack Support** - Works with Prometheus, Loki, Jaeger, Docker  

---

## 📁 Project Structure

```
neuro-ops/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── config/            # Database, Redis, environment config
│   │   ├── api/
│   │   │   ├── routes/        # API endpoint routes
│   │   │   └── controllers/   # Request handlers
│   │   ├── services/          # Business logic (incident, causal, anomaly)
│   │   ├── workers/           # Background job processors
│   │   ├── integrations/      # Prometheus, Loki, Jaeger clients
│   │   └── db/migrations/     # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                   # Nginx + React SPA
│   ├── public/
│   │   ├── index.html         # Main dashboard UI
│   │   └── app.js             # Frontend logic
│   └── nginx.conf             # Reverse proxy config
│
├── database/
│   └── migrations/            # PostgreSQL schema
│
├── monitoring/
│   ├── prometheus.yml         # Metrics scraping config
│   ├── loki-config.yml        # Log aggregation config
│   └── grafana-datasources.yml
│
├── docker-compose.yml         # Full stack orchestration
├── .env.example               # Environment variables template
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (v20+)
- Node.js 18+ (for local development)
- 4GB RAM, 20GB disk space

### 1. Clone & Setup

```bash
# Navigate to project
cd neuro-ops

# Copy environment file
cp .env.example .env

# Update .env with your settings (Claude API key, etc.)
nano .env
```

### 2. Start Everything

```bash
# Start all services (database, backend, frontend, monitoring)
docker-compose up -d

# Check logs
docker-compose logs -f backend

# View running services
docker-compose ps
```

### 3. Access Dashboard

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (admin/admin)
- **Jaeger**: http://localhost:16686
- **Loki**: http://localhost:3100

### 4. Test Incident Detection

```bash
# Create an incident via API
curl -X POST http://localhost:3001/api/incidents \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Payment Service Crash",
    "description": "OOM kill on payment pod",
    "severity": "critical",
    "target_service": "payment",
    "cascading_services": ["orders", "gateway"]
  }'

# View incident
curl http://localhost:3001/api/incidents
```

---

## 🏗️ Architecture

### Backend Services

**Incident Detection Worker** (`incident-detector.ts`)
- Runs every 5 seconds
- Monitors metrics aggregates from Redis
- Calculates anomaly scores (0-1 scale)
- Triggers incident creation when >0.75

**Causal Analyzer** (`causal-analyzer.ts`)
- Runs every 10 seconds
- Builds causal DAG from service dependencies
- Attributes root cause using PC-Algorithm
- Generates remediation playbooks

**Remediation Executor** (`remediation-executor.ts`)
- Runs every 15 seconds
- Executes playbook steps
- Manages Docker container operations
- Tracks remediation timing vs SLO

### Frontend Architecture

- **Real-time Updates**: WebSocket connection to backend metrics
- **Causal Graph Visualization**: SVG-based interactive graph
- **Incident Lifecycle**: Visual phase pipeline (Injection → Detection → Attribution → Remediation → Learning → Resolved)
- **Log Stream**: Streaming logs from Loki integrated into dashboard

### Database Schema

- `services` - Service registry with metadata
- `service_dependencies` - Dependency graph edges
- `incidents` - Incident records with lifecycle tracking
- `metrics` - Time-series metrics from Prometheus
- `playbooks` - Generated remediation playbooks
- `logs` - Log entries from Loki
- `causal_analysis` - Causal graph analysis results

---

## 📊 API Endpoints

### Incidents

```
GET    /api/incidents              # List incidents
GET    /api/incidents/:id          # Get incident
POST   /api/incidents              # Create incident
PUT    /api/incidents/:id          # Update incident
POST   /api/incidents/:id/trigger  # Trigger incident
POST   /api/incidents/:id/resolve  # Resolve incident
```

### Metrics

```
GET    /api/metrics                      # List metrics
POST   /api/metrics                      # Record metrics
GET    /api/metrics/timeseries/:service  # Get time-series
```

### Services

```
GET    /api/services                    # List services
GET    /api/services/:id                # Get service
GET    /api/services/:id/dependencies   # Service deps
GET    /api/services/:id/health         # Service health
```

### Playbooks

```
GET    /api/playbooks             # List playbooks
GET    /api/playbooks/:id         # Get playbook
POST   /api/playbooks             # Create playbook
```

### Logs

```
GET    /api/logs                  # Get logs (with filtering)
POST   /api/logs                  # Ingest logs
```

---

## 🔌 Integrations

### Prometheus

NeuroOps scrapes Prometheus every 5 seconds for:
- `http_request_duration_seconds` - Latency metrics
- `http_requests_total` - Request rate (RPS)
- `errors_total` - Error rate tracking

**Query examples:**
```promql
# P99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(errors_total[5m]) / rate(http_requests_total[5m])
```

### Loki

Logs are ingested from:
- Backend application logs (JSON format)
- Docker container logs
- Kubernetes logs (if enabled)

**Query syntax:**
```
{job="backend"} | json | level="ERROR"
{service="payment"} | unwrap latency | __error__=""
```

### Jaeger

Distributed traces for incident causality:
- Service-to-service call tracing
- Latency attribution per span
- Error propagation analysis

---

## ⚙️ Configuration

### `.env` File

```bash
# Server
NODE_ENV=development
PORT=3000
API_PORT=3001

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=neuro_ops
DB_USER=neuro_admin
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_pass

# Claude AI
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-20250514

# Feature Flags
ENABLE_CLAUDE_AI=true
ENABLE_CAUSAL_ANALYSIS=true
ENABLE_AUTO_REMEDIATION=true
CONFIDENCE_THRESHOLD=75
SLO_THRESHOLD_MS=15000
```

---

## 🧪 Testing

### Unit Tests

```bash
npm run test --workspace=backend
```

### Integration Tests

```bash
npm run test:integration
```

### Load Testing (k6)

```bash
# In a new terminal
docker run -v $PWD/tests/load.js:/load.js grafana/k6:latest \
  run /load.js --vus 50 --duration 5m
```

---

## 🔧 Development

### Local Backend Development

```bash
cd backend

# Install dependencies
npm install

# Run TypeScript compiler in watch mode
npm run dev

# In another terminal, run the server
npm start
```

### Hot Reload Frontend

```bash
# Nginx will auto-reload on file changes
# Update frontend/public/app.js and refresh browser
```

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

---

## 📈 Monitoring the Platform

### Health Checks

```bash
# API health
curl http://localhost:3001/health

# Database health
curl http://localhost:3001/api/services

# All metrics
curl http://localhost:9091/metrics
```

### Key Metrics to Track

- `incident_detection_latency_ms` - Time from anomaly to detection
- `causal_analysis_duration_ms` - Attribution computation time
- `remediation_execution_time_ms` - Auto-fix time
- `slo_compliance_ratio` - Incidents resolved within 15s
- `false_positive_rate` - Incidents that weren't real issues

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check PostgreSQL connection
docker-compose logs postgres

# Verify Redis connection
docker-compose exec redis redis-cli ping

# Check environment variables
docker-compose exec backend env | grep DB_
```

### Incidents not being detected

```bash
# Check incident detector worker
docker-compose logs backend | grep "incident-detector"

# Verify Redis cache is working
docker-compose exec redis redis-cli KEYS "*"
```

### Frontend blank page

```bash
# Check API connectivity
curl http://localhost:3001/health

# View console errors
docker-compose logs frontend

# Check nginx config
docker-compose exec frontend cat /etc/nginx/nginx.conf
```

---

## 🚦 Incident Lifecycle

1. **Standby** - Normal operation, all services healthy
2. **Injection** - Anomaly detected (automated or manual trigger)
3. **Detection** - LogBERT/LSTM signal correlation
4. **Attribution** - Causal graph analysis, root cause identified
5. **Remediation** - Playbook execution (circuit breaker, scale, heal)
6. **Learning** - Causal weights updated, playbook versioned
7. **Resolved** - SLO tracked, incident closed

---

## 📚 Key Algorithms

### Anomaly Detection

```
Anomaly Score = (Latency Deviation + Error Rate Deviation) / 2
Threshold: 0.75 (configurable)
```

### Causal Attribution

```
Causal Weight = f(latency correlation, error propagation, graph distance)
PC-Algorithm: Constraint-based causal discovery
```

### SLO Calculation

```
SLO Met = Remediation Time < 15000ms
Incident resolved when phase = 'resolved' + all metrics normalized
```

---

## 🔐 Security Best Practices

1. **Never commit `.env`** - Keep secrets out of version control
2. **Use strong DB passwords** - Change `DB_PASSWORD` in production
3. **Enable Redis authentication** - Set `REDIS_PASSWORD`
4. **Validate all API inputs** - Joi schemas on all routes
5. **Use HTTPS in production** - Configure TLS certificates
6. **Rotate Claude API keys** - Regularly update `CLAUDE_API_KEY`
7. **Limit network access** - Firewall rules for database

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📞 Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Documentation: `/docs` folder
- Email: support@neuro-ops.dev

---

**NeuroOps © 2025 · Built with ❤️ for microservices observability**
