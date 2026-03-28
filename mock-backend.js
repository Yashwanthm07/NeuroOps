/**
 * NeuroOps Mock Backend Server
 * Simulates the full backend API without requiring Docker/Database
 */

const http = require('http');
const url = require('url');

// In-memory storage (simulating database)
let incidents = [];
let services = [
    { id: 'gateway', name: 'API Gateway', icon: '⬡', port: 3000, status: 'healthy' },
    { id: 'auth', name: 'Auth Service', icon: '🔐', port: 3001, status: 'healthy' },
    { id: 'products', name: 'Product Catalog', icon: '📦', port: 3002, status: 'healthy' },
    { id: 'orders', name: 'Order Manager', icon: '🧾', port: 3003, status: 'healthy' },
    { id: 'payment', name: 'Payment Engine', icon: '💳', port: 3004, status: 'healthy' },
    { id: 'inventory', name: 'Inventory Sync', icon: '🗄', port: 3005, status: 'healthy' },
    { id: 'notification', name: 'Notifications', icon: '🔔', port: 3006, status: 'healthy' },
    { id: 'postgres', name: 'PostgreSQL', icon: '🐘', port: 5432, status: 'healthy' },
    { id: 'redis', name: 'Redis Cache', icon: '⚡', port: 6379, status: 'healthy' },
    { id: 'rabbitmq', name: 'RabbitMQ', icon: '🐇', port: 5672, status: 'healthy' },
];
let logs = [];
let playbooks = [];
let logId = 0;

const INCIDENTS_DATA = [
    { id: 'payment_crash', label: '💳 Payment Crash', target: 'payment', sev: 'critical', cascades: ['orders', 'gateway'], steps: 8 },
    { id: 'checkout_timeout', label: '🛒 Checkout Timeout', target: 'orders', sev: 'high', cascades: ['payment', 'inventory'], steps: 8 },
    { id: 'db_slowdown', label: '🐘 DB Saturation', target: 'postgres', sev: 'high', cascades: ['products', 'orders'], steps: 8 },
    { id: 'inventory_depleted', label: '📦 Inventory Depleted', target: 'inventory', sev: 'medium', cascades: ['orders'], steps: 8 },
    { id: 'auth_failure', label: '🔐 Auth Failure', target: 'auth', sev: 'critical', cascades: ['gateway'], steps: 8 },
    { id: 'cache_storm', label: '⚡ Cache Storm', target: 'redis', sev: 'medium', cascades: ['inventory'], steps: 8 },
    { id: 'shipping_delay', label: '🚚 Shipping Delay', target: 'notification', sev: 'low', cascades: [], steps: 8 },
    { id: 'net_partition', label: '🌐 Net Partition', target: 'rabbitmq', sev: 'medium', cascades: ['notification'], steps: 8 },
];

// CORS headers
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
}

// Handle preflight
function handleOptions(req, res) {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
}

// Simulate incident lifecycle
function simulateIncident(incidentDef) {
    const incidentId = `INC-${Date.now()}`;
    const incident = {
        id: incidentId,
        title: `Incident: ${incidentDef.label}`,
        description: incidentDef.label,
        severity: incidentDef.sev,
        target_service: incidentDef.target,
        cascading_services: incidentDef.cascades,
        status: 'active',
        phase: 'injection',
        confidence: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    incidents.push(incident);

    // Simulate phases with dynamic timing per incident severity
    let phase = 0;
    const phases = ['injection', 'detection', 'attribution', 'remediation', 'learning', 'resolved'];

    const severityFactor = {
        critical: 0.8,
        high: 1,
        medium: 1.2,
        low: 1.4
    }[incidentDef.sev] || 1;

    const intervalDuration = 1300 * severityFactor + Math.random() * 1200;

    const interval = setInterval(() => {
        phase++;
        incident.phase = phases[phase] || 'resolved';
        incident.status = phase >= phases.length - 1 ? 'resolved' : 'active';
        incident.confidence = Math.min(phase * 0.15, 1);
        incident.updated_at = new Date().toISOString();

        if (phase >= phases.length - 1) {
            clearInterval(interval);
            incident.resolved_at = new Date().toISOString();
            incident.remediation_time = 6000 + Math.random() * 7000 * severityFactor;
        }
    }, intervalDuration);

    // Add progress logs with varied delays
    addLog('INFO', 'NeuroOps', `Incident created: ${incidentDef.label}`);
    const logDelayBase = 1500 * severityFactor;

    setTimeout(() => addLog('AI', 'LogBERT', `Anomaly detected: score ${(0.7 + Math.random() * 0.25).toFixed(2)} on ${incidentDef.target}`), logDelayBase + Math.random() * 900);
    setTimeout(() => addLog('CAUSAL', 'PC-Algo', `Root cause: ${incidentDef.target} → ${incidentDef.cascades.join(',')}`), logDelayBase + 1800 + Math.random() * 1200);
    setTimeout(() => addLog('SYS', 'Remediation', 'Executing playbook steps...'), logDelayBase + 3200 + Math.random() * 1300);
    setTimeout(() => addLog('SYS', 'HealthProbe', '✓ Services recovered'), logDelayBase + 5600 + Math.random() * 1400);

    return incident;
}

function addLog(level, src, msg) {
    logs.unshift({
        id: ++logId,
        ts: new Date().toLocaleTimeString(),
        lv: level,
        src: src,
        msg: msg
    });
    if (logs.length > 100) logs.length = 100;
}

// Request handler
const server = http.createServer((req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        handleOptions(req, res);
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Root landing
    if (pathname === '/' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'NeuroOps API is running',
            version: '2.5.0',
            docs: 'https://github.com/Yashwanthm07/NeuroOps',
            endpoints: [
                { method: 'GET', path: '/health' },
                { method: 'GET', path: '/api/incidents' },
                { method: 'POST', path: '/api/incidents' },
                { method: 'GET', path: '/api/incidents/:id' },
                { method: 'POST', path: '/api/incidents/:id/trigger' },
                { method: 'PUT', path: '/api/incidents/:id' },
                { method: 'GET', path: '/api/services' },
                { method: 'GET', path: '/api/metrics' },
                { method: 'GET', path: '/api/logs' },
                { method: 'GET', path: '/api/playbooks' },
                { method: 'POST', path: '/api/assistant' }
            ]
        }));
        return;
    }

    // Health check
    if (pathname === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString(), version: '2.5.0' }));
        return;
    }

    // GET /api/incidents
    if (pathname === '/api/incidents' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ incidents, total: incidents.length }));
        return;
    }

    // GET /api/incidents/:id
    if (pathname.match(/^\/api\/incidents\/[^\/]+$/) && req.method === 'GET') {
        const id = pathname.split('/').pop();
        const incident = incidents.find(i => i.id === id);
        res.writeHead(incident ? 200 : 404);
        res.end(JSON.stringify(incident || { error: 'Not found' }));
        return;
    }

    // POST /api/incidents
    if (pathname === '/api/incidents' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const incident = {
                    id: `INC-${Date.now()}`,
                    title: data.title,
                    description: data.description,
                    severity: data.severity,
                    target_service: data.target_service,
                    cascading_services: data.cascading_services || [],
                    status: 'active',
                    phase: 'injection',
                    confidence: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                incidents.push(incident);
                res.writeHead(201);
                res.end(JSON.stringify(incident));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // POST /api/incidents/:id/trigger
    if (pathname.match(/^\/api\/incidents\/[^\/]+\/trigger$/) && req.method === 'POST') {
        const id = pathname.split('/')[3];
        const incDef = INCIDENTS_DATA.find(i => i.id === id);
        if (incDef) {
            simulateIncident(incDef);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }

    // PUT /api/incidents/:id
    if (pathname.match(/^\/api\/incidents\/[^\/]+$/) && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const id = pathname.split('/').pop();
            const incident = incidents.find(i => i.id === id);
            if (incident) {
                const updates = JSON.parse(body);
                Object.assign(incident, updates, { updated_at: new Date().toISOString() });
                res.writeHead(200);
                res.end(JSON.stringify(incident));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        return;
    }

    // GET /api/services
    if (pathname === '/api/services' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ services }));
        return;
    }

    // GET /api/services/:id
    if (pathname.match(/^\/api\/services\/[^\/]+$/) && req.method === 'GET') {
        const id = pathname.split('/').pop();
        const service = services.find(s => s.id === id);
        res.writeHead(service ? 200 : 404);
        res.end(JSON.stringify(service || { error: 'Not found' }));
        return;
    }

    // GET /api/metrics
    if (pathname === '/api/metrics' && req.method === 'GET') {
        const metrics = services.map(s => ({
            service_id: s.id,
            latency: Math.random() * 100 + 20,
            rps: Math.random() * 1000 + 100,
            error_rate: Math.random() * 2,
            recorded_at: new Date().toISOString()
        }));
        res.writeHead(200);
        res.end(JSON.stringify({ metrics }));
        return;
    }

    // POST /api/assistant (AI chatbot endpoint)
    if (pathname === '/api/assistant' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { message, incidentId } = JSON.parse(body);
                let reply = 'System is healthy. No active incident to report.';

                if (incidentId) {
                    const incident = INCIDENTS_DATA.find(i => i.id === incidentId);
                    if (incident) {
                        reply = `Insight for ${incident.label}: ${incident.desc || 'Investigate the incident with root-cause analysis and service recovery steps.'}`;
                    }
                } else if (message && message.toLowerCase().includes('status')) {
                    reply = 'All services are currently monitored in the dashboard. Issue alerts appear in the timeline.';
                } else if (message && message.toLowerCase().includes('recommend')) {
                    reply = 'Try the remediation playbook steps: restart service, clear cache, fine-tune autoscaling, and add distributed tracing.';
                }

                addLog('AI', 'Assistant', `Q: ${message} -> R: ${reply}`);

                res.writeHead(200);
                res.end(JSON.stringify({ reply }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
        });
        return;
    }

    // GET /api/logs
    if (pathname === '/api/logs' && req.method === 'GET') {
        const limit = parseInt(query.limit) || 100;
        res.writeHead(200);
        res.end(JSON.stringify({ logs: logs.slice(0, limit) }));
        return;
    }

    // GET /api/playbooks
    if (pathname === '/api/playbooks' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ playbooks }));
        return;
    }

    // Default 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const PORT = 3001;
server.listen(PORT, 'localhost', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          🧠 NeuroOps Mock Backend Server v2.5             ║
║              Running on http://localhost:3001              ║
╚════════════════════════════════════════════════════════════╝

📊 Available Endpoints:
  GET    /api/incidents
  POST   /api/incidents
  GET    /api/incidents/:id
  POST   /api/incidents/:id/trigger
  PUT    /api/incidents/:id
  
  GET    /api/services
  GET    /api/metrics
  GET    /api/logs
  GET    /api/playbooks
  
  GET    /health

🎨 Frontend: http://localhost:3000
🌐 Open your browser and start incident simulation!
  `);
});

process.on('SIGINT', () => {
    console.log('\n✓ Mock backend server stopped');
    process.exit(0);
});