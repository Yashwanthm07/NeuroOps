# NeuroOps Architecture Overview

## System Design

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NEURO-OPS PLATFORM v2.5                       │
├──────────────────────────────────────────────────────────────────────┤
│
│  ┌─────────────────────────────────────────────────────────────────┐
│  │                     FRONTEND (Port 3000)                        │
│  ├─────────────────────────────────────────────────────────────────┤
│  │ • Nginx reverse proxy                                          │
│  │ • SPA dashboard (index.html + app.js)                         │
│  │ • Real-time metrics visualization                             │
│  │ • Causal dependency graph rendering                           │
│  │ • Incident scenario trigger interface                         │
│  │ • Playbook modal with RCA display                             │
│  └─────────────────────────────────────────────────────────────────┘
│
│  ┌─────────────────────────────────────────────────────────────────┐
│  │                    BACKEND API (Port 3001)                      │
│  ├─────────────────────────────────────────────────────────────────┤
│  │ • Express.js TypeScript server                                 │
│  │ • 5 main route modules:                                        │
│  │   - /api/incidents      (incident CRUD + trigger)            │
│  │   - /api/metrics        (metrics aggregation)                 │
│  │   - /api/services       (service registry + health)           │
│  │   - /api/playbooks      (RCA playbook management)             │
│  │   - /api/logs           (log streaming)                       │
│  │ • Background workers (running on schedules)                   │
│  │ • Health checks & metrics export                              │
│  └─────────────────────────────────────────────────────────────────┘
│
│  ┌─────────────────────────────────────────────────────────────────┐
│  │                  BACKGROUND WORKERS                             │
│  ├─────────────────────────────────────────────────────────────────┤
│  │ 1. Incident Detector (5s interval)                             │
│  │    • Aggregates metrics from Redis                             │
│  │    • Calculates anomaly scores using deviation metrics         │
│  │    • Triggers incidents when score > 0.75                      │
│  │                                                                │
│  │ 2. Causal Analyzer (10s interval)                             │
│  │    • Builds causal DAG from service dependencies               │
│  │    • Performs root cause attribution                           │
│  │    • Generates remediation playbooks                           │
│  │                                                                │
│  │ 3. Remediation Executor (15s interval)                        │
│  │    • Executes playbook remediation steps                       │
│  │    • Manages Docker container operations                       │
│  │    • Updates incident phase and tracks SLO                     │
│  └─────────────────────────────────────────────────────────────────┘
│
│  ┌─────────────────────────────────────────────────────────────────┐
│  │                    DATA LAYER                                    │
│  ├─────────────────────────────────────────────────────────────────┤
│  │ • PostgreSQL 16                                                │
│  │   - services table (10 sample microservices)                  │
│  │   - service_dependencies (directed graph edges)               │
│  │   - incidents (lifecycle tracking)                            │
│  │   - metrics (time-series from Prometheus)                     │
│  │   - playbooks (generated RCA documents)                       │
│  │   - logs (log entries from Loki)                              │
│  │   - causal_analysis (graph analysis results)                  │
│  │                                                                │
│  │ • Redis 7 (caching & real-time state)                        │
│  │   - incident:<id>:phase (current phase)                      │
│  │   - incident:<id>:analysis (causal results)                  │
│  │   - metrics:<service>:agg (aggregated metrics)               │
│  └─────────────────────────────────────────────────────────────────┘
│
│  ┌─────────────────────────────────────────────────────────────────┐
│  │              OBSERVABILITY STACK (Port 9090+)                   │
│  ├─────────────────────────────────────────────────────────────────┤
│  │ • Prometheus 9090 (metrics scraping & storage)                │
│  │   - Scrapes backend metrics every 5 seconds                   │
│  │   - Maintains 7 days of time-series data                      │
│  │                                                                │
│  │ • Loki 3100 (log aggregation)                                 │
│  │   - Stores structured logs from all services                  │
│  │   - 7 day retention by default                                │
│  │                                                                │
│  │ • Jaeger 16686 (distributed tracing)                         │
│  │   - Traces service-to-service calls                           │
│  │   - Latency attribution per span                              │
│  │                                                                │
│  │ • Grafana 3002 (visualization dashboard)                     │
│  │   - Pre-configured datasources (Prometheus, Loki, Jaeger)   │
│  │   - Admin credentials: admin/admin                           │
│  └─────────────────────────────────────────────────────────────────┘
│
└──────────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER TRIGGERS INCIDENT                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: POST /api/incidents with scenario details            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND: Create incident record in PostgreSQL                 │
│  Status: 'active' | Phase: 'injection'                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (5s later)
┌─────────────────────────────────────────────────────────────────┐
│  INCIDENT DETECTOR: Calculate anomaly score                    │
│  → Detect cascade impacts                                       │
│  → Move phase to 'detection'                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (10s later)
┌─────────────────────────────────────────────────────────────────┐
│  CAUSAL ANALYZER: Build causal DAG                             │
│  → Attribute root cause (target service)                        │
│  → Generate playbook with remediation steps                     │
│  → Move phase to 'attribution'                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (15s later)
┌─────────────────────────────────────────────────────────────────┐
│  REMEDIATION EXECUTOR: Execute playbook steps                  │
│  → Docker operations (restart, scale, health check)             │
│  → Track remediation time vs SLO                                │
│  → Move phase to 'remediation' → 'learning' → 'resolved'       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: Display playbook modal with:                        │
│  • Root cause analysis from Claude AI                           │
│  • Blast radius (affected services)                             │
│  • Remediation steps executed                                   │
│  • Prevention measures                                          │
│  • SLO compliance (Met/Breached)                               │
└─────────────────────────────────────────────────────────────────┘
```

## Incident Lifecycle States

```
┌─────────────┐
│  STANDBY    │ ← Normal operation, all services healthy
└──────┬──────┘
       │ (Manual trigger or anomaly detected)
       ↓
┌─────────────┐
│ INJECTION   │ ← Incident begins, initial fault introduced
└──────┬──────┘
       │ (5 seconds)
       ↓
┌─────────────┐
│ DETECTION   │ ← LogBERT/LSTM anomaly signals identified
└──────┬──────┘
       │ (10 seconds)
       ↓
┌─────────────┐
│ATTRIBUTION  │ ← PC-Algorithm finds root cause, builds causal graph
└──────┬──────┘
       │ (15 seconds)
       ↓
┌─────────────┐
│REMEDIATION  │ ← Playbook execution, auto-healing begins
└──────┬──────┘
       │ (variable duration)
       ↓
┌─────────────┐
│  LEARNING   │ ← Causal weights updated, playbook versioned
└──────┬──────┘
       │ (2-3 seconds)
       ↓
┌─────────────┐
│ RESOLVED ✓  │ ← Incident closed, SLO tracked, back to STANDBY
└─────────────┘

SLO Target: < 15 seconds from INJECTION to RESOLVED
```

## Data Models

### Service
```typescript
{
  id: string              // UUID
  name: string            // "API Gateway", "Payment Engine", etc.
  icon: string            // Emoji icon
  port: number            // Service port
  status: string          // 'healthy' | 'degraded' | 'critical'
  created_at: timestamp
  updated_at: timestamp
}
```

### Incident
```typescript
{
  id: string              // "INC-{timestamp}"
  title: string
  description: string
  severity: string        // 'critical' | 'high' | 'medium' | 'low'
  target_service: string  // Root cause service ID
  cascading_services: []  // Affected downstream services
  status: string          // 'active' | 'resolved'
  phase: string           // See lifecycle above
  confidence: float       // 0-1 anomaly/attribution score
  root_cause: string
  remediation_time: int   // milliseconds
  created_at: timestamp
  updated_at: timestamp
  resolved_at: timestamp
}
```

### Playbook
```typescript
{
  id: string              // "PB-2025-XXX"
  incident_id: string
  root_cause: string      // AI-generated explanation
  blast_radius: []        // Affected services
  remediation_steps: []   // Actions to resolve
  prevention_measures: [] // To prevent recurrence
  confidence: float       // AI confidence in analysis
  created_at: timestamp
}
```

## Key Algorithms

### 1. Anomaly Detection
```
Latency Deviation = (current_latency - baseline_latency) / baseline_latency
Error Rate Deviation = (current_error_rate - baseline) / baseline
Anomaly Score = (Latency Deviation + Error Rate Deviation) / 2
Trigger: Score > threshold (default 0.75)
```

### 2. Cascade Detection
```
Cascade = all_downstream_services(root_cause_service)
Using service_dependencies table as directed graph
BFS traversal from incident target_service
```

### 3. Root Cause Attribution
```
PC-Algorithm: Constraint-based causal discovery
Input: Causal DAG from service dependencies + anomaly timing
Output: Root cause probability distribution
Selected: Service with highest probability
```

### 4. SLO Tracking
```
SLO_Met = (RESOLVED timestamp - INJECTION timestamp) < 15000ms
For each incident:
- Track elapsed time
- Flag if SLO breach occurs
- Update sloMet counter
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│            Docker Compose Orchestration             │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────┐  │
│  │  frontend   │  │   backend    │  │postgres│  │
│  │  (nginx)    │  │  (node)      │  │(db)    │  │
│  └─────────────┘  └──────────────┘  └────────┘  │
│                                                  │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐ │
│  │   redis    │  │prometheus│  │    loki    │ │
│  │  (cache)   │  │(metrics) │  │  (logs)    │ │
│  └────────────┘  └──────────┘  └─────────────┘ │
│                                                  │
│  ┌──────────────┐  ┌───────────────┐          │
│  │    jaeger    │  │    grafana    │          │
│  │  (tracing)   │  │  (dashboard)  │          │
│  └──────────────┘  └───────────────┘          │
│                                                │
└────────────────────────────────────────────────┘
                      ↓
        neuro-network (Docker bridge)
```

## Configuration & Environment Variables

```bash
# Compute
NODE_ENV=development
PORT=3000
API_PORT=3001

# Database Connection Pooling
DB_HOST=postgres
DB_PORT=5432
DB_MAX_POOL=20
DB_IDLE_TIMEOUT_MS=30000

# Redis Connection
REDIS_RETRY_STRATEGY=exponential

# Feature Flags
ENABLE_CLAUDE_AI=true
ENABLE_CAUSAL_ANALYSIS=true
ENABLE_AUTO_REMEDIATION=true
ENABLE_GRAPH_LEARNING=true

# Thresholds
CONFIDENCE_THRESHOLD=75
SLO_THRESHOLD_MS=15000
ANOMALY_THRESHOLD=0.75
METRIC_WINDOW_SIZE=300000 (5 minutes)

# Incident Detection Interval
INCIDENT_DETECTION_INTERVAL=5000 (5 seconds)
```

## Network Architecture

```
┌─ User Browser ─────────────────────────────────────────┐
│                                                        │
│  http://localhost:3000 (Frontend)                     │
│          ↓                                            │
├─ Nginx Container ─────────────────────────────────────┤
│  • Serves index.html + app.js                        │
│  • Proxies /api/* → backend:3001                     │
│          ↓                                            │
├─ Backend Container (Node.js) ──────────────────────────┤
│  • Listens on :3001                                  │
│  • Connects to postgres:5432                         │
│  • Connects to redis:6379                            │
│  • Metrics export on :9091                           │
│          ↓                                            │
├─ PostgreSQL Container ────────────────────────────────┤
│  • Listens on :5432 (internal only)                  │
│  • Schema: services, incidents, metrics, etc.        │
│          ↓                                            │
├─ Redis Container ─────────────────────────────────────┤
│  • Listens on :6379 (internal only)                  │
│  • Stores: incident phases, metric aggregates        │
│                                                       │
└───────────────────────────────────────────────────────┘

Observability Stack (accessible from host):
┌─ Prometheus :9090   (metrics database)
├─ Grafana :3002      (visualization)
├─ Jaeger :16686      (tracing UI)
└─ Loki :3100         (logs API)
```

---

**NeuroOps Architecture © 2025**
