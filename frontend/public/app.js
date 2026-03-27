// ──────────────────────────────────────────────────────────────────────────────
// NeuroOps Frontend - Causal AI Observability Dashboard
// ──────────────────────────────────────────────────────────────────────────────

const API_HOST = window.location.hostname;
const API_PORT = 3001;
const API_BASE = `http://${API_HOST}:${API_PORT}/api`;

// ──────────────────────────────────────────────────────────────────────────────
// DATA & CONFIG
// ──────────────────────────────────────────────────────────────────────────────
const SERVICES = [
    { id: 'gateway', name: 'API Gateway', icon: '⬡', port: 3000, deps: ['auth', 'products', 'orders', 'payment', 'inventory', 'notification'], bLat: 45, bRps: 850, bErr: 0.2, x: 400, y: 40 },
    { id: 'auth', name: 'Auth Service', icon: '🔐', port: 3001, deps: [], bLat: 28, bRps: 320, bErr: 0.1, x: 80, y: 160 },
    { id: 'products', name: 'Product Catalog', icon: '📦', port: 3002, deps: ['postgres'], bLat: 62, bRps: 410, bErr: 0.3, x: 240, y: 160 },
    { id: 'orders', name: 'Order Manager', icon: '🧾', port: 3003, deps: ['postgres', 'payment', 'inventory'], bLat: 95, bRps: 180, bErr: 0.2, x: 400, y: 160 },
    { id: 'payment', name: 'Payment Engine', icon: '💳', port: 3004, deps: [], bLat: 210, bRps: 95, bErr: 0.4, x: 560, y: 160 },
    { id: 'inventory', name: 'Inventory Sync', icon: '🗄', port: 3005, deps: ['redis'], bLat: 35, bRps: 260, bErr: 0.2, x: 720, y: 160 },
    { id: 'notification', name: 'Notifications', icon: '🔔', port: 3006, deps: ['rabbitmq'], bLat: 55, bRps: 140, bErr: 0.1, x: 80, y: 270 },
    { id: 'postgres', name: 'PostgreSQL', icon: '🐘', port: 5432, deps: [], bLat: 8, bRps: 1200, bErr: 0.05, x: 280, y: 270 },
    { id: 'redis', name: 'Redis Cache', icon: '⚡', port: 6379, deps: [], bLat: 2, bRps: 3200, bErr: 0.02, x: 520, y: 270 },
    { id: 'rabbitmq', name: 'RabbitMQ', icon: '🐇', port: 5672, deps: [], bLat: 12, bRps: 680, bErr: 0.05, x: 720, y: 270 },
];

const INCIDENTS = [
    { id: 'payment_crash', label: '💳 Payment Crash', target: 'payment', sev: 'critical', cascades: ['orders', 'gateway'], desc: 'Payment engine OOM kill — cascades to order processing' },
    { id: 'checkout_timeout', label: '🛒 Checkout Timeout', target: 'orders', sev: 'high', cascades: ['payment', 'inventory'], desc: 'Cash payment checkout hangs due to payment service overload' },
    { id: 'db_slowdown', label: '🐘 DB Saturation', target: 'postgres', sev: 'high', cascades: ['products', 'orders'], desc: 'PostgreSQL connection pool exhausted — N+1 query storm' },
    { id: 'inventory_depleted', label: '📦 Inventory Depleted', target: 'inventory', sev: 'medium', cascades: ['orders'], desc: 'Inventory service reports out of stock for popular items' },
    { id: 'auth_failure', label: '🔐 Auth Failure', target: 'auth', sev: 'critical', cascades: ['gateway'], desc: 'Authentication service down — users cannot log in' },
    { id: 'cache_storm', label: '⚡ Cache Storm', target: 'redis', sev: 'medium', cascades: ['inventory'], desc: 'Redis eviction storm causes inventory cache miss cascade' },
    { id: 'shipping_delay', label: '🚚 Shipping Delay', target: 'notification', sev: 'low', cascades: [], desc: 'Shipping notification service delayed — orders not updated' },
    { id: 'net_partition', label: '🌐 Net Partition', target: 'rabbitmq', sev: 'medium', cascades: ['notification'], desc: 'RabbitMQ network partition isolates notification consumers' },
];

const INCIDENT_REMEDIATIONS = {
    payment_crash: [
        { step: 'Restart payment pods on active cluster', delay: 800 },
        { step: 'Check memory utilization and OOM logs', delay: 1500 },
        { step: 'Scale payment deployment + add circuit breaker', delay: 2400 },
        { step: 'Notify SRE on-call and run root-cause analysis', delay: 3400 },
    ],
    checkout_timeout: [
        { step: 'Enable request timeout in orders service', delay: 900 },
        { step: 'Throttling for cash payment API', delay: 1700 },
        { step: 'Profiling slow queries in checkout path', delay: 2600 },
        { step: 'Release a quick fix to reduce load', delay: 3500 },
    ],
    db_slowdown: [
        { step: 'Add read replica and route reads', delay: 1150 },
        { step: 'Increase connection pool', delay: 2050 },
        { step: 'Kill expensive queries and delete indexes', delay: 2850 },
        { step: 'Enable query plan caching layer', delay: 3750 },
    ],
    inventory_depleted: [
        { step: 'Unblock inventory sync jobs', delay: 1000 },
        { step: 'Replenish from fast stock paths', delay: 1800 },
        { step: 'Trigger automated restock alert', delay: 2500 },
        { step: 'Tune thresholds and safety stock model', delay: 3300 },
    ],
    auth_failure: [
        { step: 'Failover auth cluster and disable new sessions', delay: 700 },
        { step: 'Capture token backend errors and retry', delay: 1600 },
        { step: 'Rollback recent auth deploy', delay: 2500 },
        { step: 'Run full security and key verification', delay: 3600 },
    ],
    cache_storm: [
        { step: 'Drop bogus keys and clear hot cache', delay: 720 },
        { step: 'Enable cache warming for top keys', delay: 1450 },
        { step: 'Tune eviction policy and local hits', delay: 2250 },
        { step: 'Notify control plane for autoscaling', delay: 3150 },
    ],
    shipping_delay: [
        { step: 'Free up notification queue worker slots', delay: 800 },
        { step: 'Requeue stalled messages', delay: 1550 },
        { step: 'Scale RabbitMQ consumption pool', delay: 2300 },
        { step: 'Audit delivery pipeline for lag sources', delay: 3100 },
    ],
    net_partition: [
        { step: 'Reestablish RabbitMQ network links', delay: 900 },
        { step: 'Switch to cross-region fallback queues', delay: 1750 },
        { step: 'Flush partially delivered messages', delay: 2550 },
        { step: 'Set partition-tolerant fallback mode', delay: 3400 },
    ],
};


const PHASES = ['standby', 'injection', 'detection', 'attribution', 'remediation', 'learning', 'resolved'];
const PHASE_COLORS = { standby: '#6b7280', injection: '#ef4444', detection: '#f59e0b', attribution: '#1e40af', remediation: '#2563eb', learning: '#10b981', resolved: '#10b981' };
const PHASE_LABELS = { standby: 'STANDBY', injection: 'FAULT INJECTION', detection: 'AI DETECTION', attribution: 'CAUSAL ATTRIBUTION', remediation: 'AUTO-REMEDIATION', learning: 'GRAPH LEARNING', resolved: 'RESOLVED ✓' };

// State
let phase = 'standby';
let activeIncident = null;
let selectedIncident = null;
let serviceState = {};
let logs = [];
let logId = 0;
let elapsedMs = 0;
let startTime = null;
let totalIncidents = 0;
let sloMet = 0;

// Charts
let latencyChart, rpsChart, errorChart;

// Chatbot
let chatMessages = [];

SERVICES.forEach(s => {
    serviceState[s.id] = { latency: s.bLat, rps: s.bRps, err: s.bErr, status: 'healthy', spark: Array(20).fill(s.bLat), sparkRps: Array(20).fill(s.bRps), sparkErr: Array(20).fill(s.bErr) };
});

// ──────────────────────────────────────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmtMs = (ms) => ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's';
const sColor = (status) => ({ healthy: '#10b981', degraded: '#f59e0b', warning: '#ea580c', critical: '#ef4444', recovering: '#3b82f6' }[status] || '#64748b');

// ──────────────────────────────────────────────────────────────────────────────
// RENDER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────
function renderHeader() {
    const c = PHASE_COLORS[phase];
    const phaseDot = document.getElementById('phase-dot');
    if (phaseDot) phaseDot.style.background = c;
    const phaseLabel = document.getElementById('phase-label');
    if (phaseLabel) phaseLabel.textContent = PHASE_LABELS[phase];
    const phaseLabel2 = document.getElementById('phase-label-2');
    if (phaseLabel2) phaseLabel2.textContent = PHASE_LABELS[phase];

    const logoAccent = document.getElementById('logo-accent');
    if (logoAccent) logoAccent.style.color = c;
    document.getElementById('hdr-incidents').textContent = totalIncidents;
    document.getElementById('hdr-slo').textContent = totalIncidents > 0 ? `${sloMet}/${totalIncidents}` : '—';
}

function renderMetricsBar() {
    let totRps = 0,
        totLat = 0,
        totErr = 0,
        healthy = 0;
    SERVICES.forEach(s => {
        const st = serviceState[s.id];
        totRps += st.rps;
        totLat += st.latency;
        totErr += st.err;
        if (st.status === 'healthy') healthy++;
    });
    document.getElementById('mb-rps').textContent = Math.round(totRps).toLocaleString() + ' req/s';
    document.getElementById('mb-lat').textContent = Math.round(totLat / SERVICES.length) + 'ms';
    document.getElementById('mb-err').textContent = (totErr / SERVICES.length).toFixed(2) + '%';
    document.getElementById('mb-health').textContent = healthy + '/' + SERVICES.length;
    document.getElementById('svc-panel-status').textContent = healthy === SERVICES.length ? 'ALL HEALTHY' : (SERVICES.length - healthy) + ' DEGRADED';
    const svcCount = document.getElementById('svc-count');
    if (svcCount) svcCount.textContent = SERVICES.length;
}

function renderServiceCards() {
    const list = document.getElementById('svc-list');
    if (!list.children.length) {
        SERVICES.forEach(s => {
            const card = document.createElement('div');
            card.className = 'svc-card';
            card.id = 'svc-' + s.id;
            card.innerHTML = `<div class="svc-card-stripe" id="stripe-${s.id}"></div>
        <div style="margin-left:6px"><div class="svc-name-row"><span class="svc-icon">${s.icon}</span><span class="svc-name">${s.name}</span></div>
        <div class="svc-metrics">
          <div class="svc-metric"><div class="svc-metric-l">P99</div><div class="svc-metric-v" id="mv-lat-${s.id}">0ms</div></div>
          <div class="svc-metric"><div class="svc-metric-l">RPS</div><div class="svc-metric-v" id="mv-rps-${s.id}">0</div></div>
          <div class="svc-metric"><div class="svc-metric-l">ERR%</div><div class="svc-metric-v" id="mv-err-${s.id}">0%</div></div>
        </div></div>`;
            list.appendChild(card);
        });
    }
    SERVICES.forEach(s => {
        const st = serviceState[s.id];
        const c = sColor(st.status);
        document.getElementById('stripe-' + s.id).style.background = c;
        document.getElementById('mv-lat-' + s.id).textContent = st.latency + 'ms';
        document.getElementById('mv-rps-' + s.id).textContent = st.rps.toLocaleString();
        document.getElementById('mv-err-' + s.id).textContent = st.err + '%';
    });
}

function renderGraph() {
    const svg = document.getElementById('graph-svg');
    const W = 800,
        H = 300;
    const xs = SERVICES.map(s => s.x),
        ys = SERVICES.map(s => s.y);
    const minX = Math.min(...xs),
        maxX = Math.max(...xs),
        minY = Math.min(...ys),
        maxY = Math.max(...ys);
    const padX = 70,
        padY = 40;
    const pos = {};

    SERVICES.forEach(s => {
        pos[s.id] = { x: padX + ((s.x - minX) / (maxX - minX || 1)) * (W - padX * 2), y: padY + ((s.y - minY) / (maxY - minY || 1)) * (H - padY * 2) };
    });

    const edges = [];
    SERVICES.forEach(s => s.deps.forEach(d => edges.push({ from: s.id, to: d })));

    let html = `<defs><filter id="glow-r"><feGaussianBlur stdDeviation="4"/></filter></defs>`;

    SERVICES.forEach(s => {
        const p = pos[s.id];
        const st = serviceState[s.id];
        const c = sColor(st.status);
        const r = activeIncident?.target === s.id ? 21 : 15;
        html += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${c}14" stroke="${c}" stroke-width="1"/>
      <text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central" font-size="14">${s.icon}</text>`;
    });

    svg.innerHTML = html;
}

function renderIncidentPanel() {
    const grid = document.getElementById('scenario-grid');
    if (!grid.children.length) {
        INCIDENTS.forEach(inc => {
            const btn = document.createElement('button');
            btn.className = 'scenario-btn';
            btn.textContent = inc.label;
            btn.setAttribute('data-id', inc.id);
            btn.onclick = () => selectIncident(inc);
            grid.appendChild(btn);
        });
    }
    INCIDENTS.forEach(inc => {
        const btn = grid.querySelector(`[data-id="${inc.id}"]`);
        if (btn) {
            btn.disabled = phase !== 'standby';
            btn.classList.toggle('selected', selectedIncident?.id === inc.id);
        }
    });
    renderSelectedIncidentDetails();
}

function selectIncident(inc) {
    if (phase !== 'standby') return;
    selectedIncident = inc;
    renderAll();
}

function renderSelectedIncidentDetails() {
    const detailsDiv = document.getElementById('selected-incident-details');
    if (!detailsDiv) return;
    if (!selectedIncident) {
        detailsDiv.style.display = 'none';
        return;
    }
    detailsDiv.style.display = 'block';
    const plan = INCIDENT_REMEDIATIONS[selectedIncident.id] || [];
    let html = `<div class="ip-section-hdr">SELECTED SCENARIO: ${selectedIncident.label.toUpperCase()}</div>
                <div style="margin-bottom: 10px; font-size: 10px; color: var(--dim);">${selectedIncident.desc}</div>
                <div style="margin-bottom: 10px;">
                    <strong>Expected Errors & Timeline:</strong>
                    <ul style="font-size: 9px; margin: 5px 0; padding-left: 15px;">
                        <li>0s: Initial fault injection - ${selectedIncident.desc}</li>
                        <li>1.3-2.5s: AI Detection - Anomaly detected</li>
                        <li>2.1-3.9s: Causal Attribution - Root cause identified</li>
                        <li>3.3-5.7s: Auto-Remediation - Steps executed</li>
                        <li>4.8-7.7s: Resolution - Incident resolved</li>
                    </ul>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Remediation Steps & Times:</strong>
                    <ul style="font-size: 9px; margin: 5px 0; padding-left: 15px;">`;
    plan.forEach((step, i) => {
        const time = (step.delay / 1000).toFixed(1);
        html += `<li>${time}s: ${step.step}</li>`;
    });
    html += `</ul>
                </div>
                <button id="inject-fault-btn" class="export-btn" style="width: 100%;" ${phase !== 'standby' ? 'disabled' : ''}>INJECT FAULT</button>`;
    detailsDiv.innerHTML = html;
    const btn = document.getElementById('inject-fault-btn');
    btn.onclick = () => triggerIncident(selectedIncident);
    btn.disabled = phase !== 'standby';
}

function renderLogs() {
    const list = document.getElementById('log-list');
    list.innerHTML = '';
    logs.slice(0, 50).forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const c = log.lv === 'ERROR' ? '#ff3366' : log.lv === 'AI' ? '#7c3aed' : '#64748b';
        entry.innerHTML = `<span class="log-ts">${log.ts}</span><span class="log-level" style="color:${c}">${log.lv}</span><span class="log-src">[${log.src}]</span><span class="log-msg">${log.msg}</span>`;
        list.appendChild(entry);
    });
}

function initCharts() {
    const ctxLatency = document.getElementById('latency-chart').getContext('2d');
    latencyChart = new Chart(ctxLatency, {
        type: 'line',
        data: {
            labels: Array.from({length: 20}, (_, i) => i + 1),
            datasets: SERVICES.map(s => ({
                label: s.name,
                data: serviceState[s.id].spark,
                borderColor: sColor(serviceState[s.id].status),
                backgroundColor: sColor(serviceState[s.id].status) + '20',
                fill: false,
                tension: 0.1
            }))
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Latency (ms) Trends'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const ctxRps = document.getElementById('rps-chart').getContext('2d');
    rpsChart = new Chart(ctxRps, {
        type: 'line',
        data: {
            labels: Array.from({length: 20}, (_, i) => i + 1),
            datasets: SERVICES.map(s => ({
                label: s.name,
                data: serviceState[s.id].sparkRps,
                borderColor: sColor(serviceState[s.id].status),
                backgroundColor: sColor(serviceState[s.id].status) + '20',
                fill: false,
                tension: 0.1
            }))
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Requests Per Second (RPS) Trends'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const ctxError = document.getElementById('error-chart').getContext('2d');
    errorChart = new Chart(ctxError, {
        type: 'line',
        data: {
            labels: Array.from({length: 20}, (_, i) => i + 1),
            datasets: SERVICES.map(s => ({
                label: s.name,
                data: serviceState[s.id].sparkErr,
                borderColor: sColor(serviceState[s.id].status),
                backgroundColor: sColor(serviceState[s.id].status) + '20',
                fill: false,
                tension: 0.1
            }))
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Error Rate (%) Trends'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            }
        }
    });
}

function updateCharts() {
    if (latencyChart) {
        latencyChart.data.datasets.forEach((dataset, i) => {
            const s = SERVICES[i];
            dataset.data = serviceState[s.id].spark;
            dataset.borderColor = sColor(serviceState[s.id].status);
            dataset.backgroundColor = sColor(serviceState[s.id].status) + '20';
        });
        latencyChart.update();
    }

    if (rpsChart) {
        rpsChart.data.datasets.forEach((dataset, i) => {
            const s = SERVICES[i];
            dataset.data = serviceState[s.id].sparkRps;
            dataset.borderColor = sColor(serviceState[s.id].status);
            dataset.backgroundColor = sColor(serviceState[s.id].status) + '20';
        });
        rpsChart.update();
    }

    if (errorChart) {
        errorChart.data.datasets.forEach((dataset, i) => {
            const s = SERVICES[i];
            dataset.data = serviceState[s.id].sparkErr;
            dataset.borderColor = sColor(serviceState[s.id].status);
            dataset.backgroundColor = sColor(serviceState[s.id].status) + '20';
        });
        errorChart.update();
    }
}

function addChatMessage(msg, type = 'ai') {
    chatMessages.push({ msg, type, time: new Date().toLocaleTimeString() });
    if (chatMessages.length > 20) chatMessages.shift();
    renderChat();
}

function renderChat() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    chatMessages.forEach(m => {
        const div = document.createElement('div');
        div.className = `chat-msg chat-${m.type}`;
        div.textContent = `${m.type === 'ai' ? 'AI: ' : 'You: '}${m.msg}`;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

async function handleChatSend() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    addChatMessage(msg, 'user');
    input.value = '';

    const payload = {
        message: msg,
        incidentId: activeIncident ? activeIncident.id : null
    };

    try {
        const response = await fetch(`${API_BASE}/assistant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            const reply = data.reply || 'I could not derive a response. Please try again.';
            addChatMessage(reply, 'ai');
            speakResponse(reply);
            return;
        }
    } catch (e) {
        console.warn('Assistant API call failed, fallback to local model', e);
    }

    // Fallback local AI simulation if API is unavailable
    const deliverMessage = () => {
        let responses = [];
        if (activeIncident) {
            switch (activeIncident.id) {
                case 'payment_crash':
                    responses = [
                        "Payment service is down. Immediate action: Restart payment pods and check for memory leaks.",
                        "Critical payment failure detected. Rollback to previous stable version.",
                        "Payment engine OOM. Scale horizontally and monitor memory usage closely."
                    ];
                    break;
                case 'checkout_timeout':
                    responses = [
                        "Checkout timeout due to payment overload. Implement circuit breaker pattern.",
                        "Cash payment checkout hanging. Add timeout handling and retry logic.",
                        "Order service bottleneck. Optimize database queries for checkout flow."
                    ];
                    break;
                case 'db_slowdown':
                    responses = [
                        "Database saturation detected. Add read replicas and optimize slow queries.",
                        "Connection pool exhausted. Increase pool size and implement connection pooling.",
                        "N+1 query storm in products. Use eager loading and query optimization."
                    ];
                    break;
                case 'inventory_depleted':
                    responses = [
                        "Inventory depleted for key items. Implement demand forecasting.",
                        "Stock levels critical. Set up automated reordering alerts.",
                        "Inventory sync failing. Check Redis cache consistency and refresh data."
                    ];
                    break;
                case 'auth_failure':
                    responses = [
                        "Authentication service down. Failover to backup auth servers.",
                        "Users cannot log in. Check token validation and refresh mechanisms.",
                        "Critical auth outage. Implement multi-region auth redundancy."
                    ];
                    break;
                case 'cache_storm':
                    responses = [
                        "Redis cache storm. Implement cache warming and eviction policies.",
                        "Cache miss cascade. Add cache hit rate monitoring and alerts.",
                        "Inventory cache failing. Use write-through caching strategy."
                    ];
                    break;
                case 'shipping_delay':
                    responses = [
                        "Shipping notifications delayed. Scale notification workers.",
                        "Order status updates slow. Optimize message queue processing.",
                        "Shipping service lag. Check RabbitMQ cluster health."
                    ];
                    break;
                case 'net_partition':
                    responses = [
                        "Network partition in messaging. Implement message deduplication.",
                        "RabbitMQ isolated. Set up cross-region message replication.",
                        "Notification consumers disconnected. Add retry mechanisms with exponential backoff."
                    ];
                    break;
                default:
                    responses = [
                        "Analyzing incident pattern. Gathering more telemetry data.",
                        "Incident detected. Initiating automated diagnostic routines.",
                        "Service degradation identified. Preparing remediation playbook."
                    ];
            }
        } else {
            responses = [
                "System is in standby mode. Monitoring all services for anomalies.",
                "No active incidents. Performing routine health checks.",
                "Platform operating normally. Ready for incident response."
            ];
        }
        const response = responses[Math.floor(Math.random() * responses.length)];
        addChatMessage(response, 'ai');
        speakResponse(response); // Add voice output

        const followupResponses = [
            'Correlating event streams for root-cause context.',
            'Proposing remediation steps and watch conditions.',
            'Assessing dependency impact and rollback plan.'
        ];

        followupResponses.forEach((msg, index) => {
            setTimeout(() => addChatMessage(msg, 'ai'), 600 + index * (600 + Math.random() * 1200));
        });
    };

    setTimeout(deliverMessage, 800 + Math.random() * 2600);
}

function showPredictiveAlert() {
    const alert = document.getElementById('predictive-alert');
    const services = ['payment', 'postgres', 'redis', 'gateway'];
    const service = services[Math.floor(Math.random() * services.length)];
    alert.textContent = `⚠️ PREDICTED: ${service.charAt(0).toUpperCase() + service.slice(1)} Service Issue in ${Math.floor(Math.random() * 10) + 1}min`;
    alert.style.display = 'block';
    setTimeout(() => alert.style.display = 'none', 5000);
}

function speakResponse(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.2;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
    }
}

function startVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            document.getElementById('voice-btn').textContent = '🎙️';
            document.getElementById('voice-btn').style.background = 'rgba(255, 170, 0, 0.2)';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chat-input').value = transcript;
            handleChatSend();
        };

        recognition.onend = () => {
            document.getElementById('voice-btn').textContent = '🎤';
            document.getElementById('voice-btn').style.background = 'rgba(0, 255, 136, 0.1)';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            addChatMessage('Voice recognition failed. Please try again or type your message.', 'ai');
        };

        recognition.start();
    } else {
        addChatMessage('Voice recognition not supported in this browser.', 'ai');
    }
}

function renderAll() {
    renderHeader();
    renderMetricsBar();
    renderServiceCards();
    renderGraph();
    renderIncidentPanel();
    renderLogs();
    updateCharts();
    renderChat();
}

// ──────────────────────────────────────────────────────────────────────────────
// INCIDENT ENGINE
// ──────────────────────────────────────────────────────────────────────────────
async function triggerIncident(inc) {
    if (phase !== 'standby') return;
    activeIncident = inc;
    startTime = Date.now();
    phase = 'injection';
    renderAll();

    try {
        // Call backend API to trigger incident
        const response = await fetch(`${API_BASE}/incidents/${inc.id}/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service: inc.target, cascades: inc.cascades })
        }).catch(() => null);

        logs.unshift({ ts: new Date().toLocaleTimeString(), lv: 'ERROR', src: inc.target, msg: `FATAL: ${inc.desc}` });
    } catch (e) {
        console.error('API Error:', e);
    }

    const detectionDelay = 1300 + Math.random() * 1200;
    const attributionDelay = 800 + Math.random() * 1400;
    const remediationDelay = 1200 + Math.random() * 1800;
    const resolveDelay = 1500 + Math.random() * 2200;

    await new Promise(r => setTimeout(r, detectionDelay));
    phase = 'detection';
    logs.unshift({ ts: new Date().toLocaleTimeString(), lv: 'AI', src: 'LogBERT', msg: `Anomaly score: ${ (0.75 + Math.random() * 0.25).toFixed(2)} detected` });
    renderAll();

    await new Promise(r => setTimeout(r, attributionDelay));
    phase = 'attribution';
    logs.unshift({ ts: new Date().toLocaleTimeString(), lv: 'CAUSAL', src: 'PC-Algo', msg: `Causal edge: ${inc.target} → ${inc.cascades.join(',')}` });
    renderAll();

    await new Promise(r => setTimeout(r, remediationDelay));
    phase = 'remediation';
    document.getElementById('remediation-section').style.display = 'block';
    chatMessages = [];
    addChatMessage(`Incident detected: ${inc.label}. Analyzing root cause...`, 'ai');

    const plan = INCIDENT_REMEDIATIONS[inc.id] || [];
    plan.forEach((step, i) => {
        setTimeout(() => addChatMessage(`Remedy ${i + 1}: ${step.step}`, 'ai'), step.delay);
    });

    await new Promise(r => setTimeout(r, resolveDelay));
    phase = 'resolved';
    elapsedMs = Date.now() - startTime;
    const isSlo = elapsedMs < 15000;
    logs.unshift({ ts: new Date().toLocaleTimeString(), lv: 'SYS', src: 'NeuroOps', msg: `✓ RESOLVED in ${fmtMs(elapsedMs)}` });
    totalIncidents++;
    if (isSlo) sloMet++;
    renderAll();
    openPlaybook(inc, isSlo);

    await new Promise(r => setTimeout(r, 3000));
    phase = 'standby';
    activeIncident = null;
    selectedIncident = null;
    renderAll();
}

function openPlaybook(inc, isSlo) {
    document.getElementById('playbook-modal').classList.add('open');
    document.getElementById('pb-slo-badge').textContent = isSlo ? `✓ SLO MET ${fmtMs(elapsedMs)}` : `✗ SLO BREACHED ${fmtMs(elapsedMs)}`;
    document.getElementById('pb-meta').textContent = `${inc.label} · Claude Sonnet + Causal AI Analysis`;
    document.getElementById('pb-body').innerHTML = `
    <div class="pb-section"><div style="color:#ff3366">ROOT CAUSE</div><div class="pb-root-cause">${inc.desc}</div></div>
    <div class="pb-section"><div style="color:#ffaa00">BLAST RADIUS</div><div >${inc.cascades.map(s => `<span style="background:#ffaa00; padding:4px 8px; border-radius:3px; margin:2px; display:inline-block">${s}</span>`).join('')}</div></div>
  `;
}

function closePlaybook() {
  document.getElementById('playbook-modal').classList.remove('open');
}

// ──────────────────────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────────────────────

// Fetch metrics from backend API
async function fetchMetricsFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    const data = await res.json();
    if (data.metrics && Array.isArray(data.metrics)) {
      data.metrics.forEach(m => {
        if (serviceState[m.service_id]) {
          serviceState[m.service_id].latency = m.latency || serviceState[m.service_id].latency;
          serviceState[m.service_id].rps = m.rps || serviceState[m.service_id].rps;
          serviceState[m.service_id].err = m.error_rate || serviceState[m.service_id].err;
        }
      });
    }
  } catch (e) {
    console.error('Metrics fetch error:', e);
  }
}

// Fetch logs from backend API
async function fetchLogsFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/logs?limit=20`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    const data = await res.json();
    if (data.logs && Array.isArray(data.logs)) {
      // Merge API logs with local logs
      const apiLogs = data.logs.map(l => ({
        ts: l.ts || new Date().toLocaleTimeString(),
        lv: l.lv || 'INFO',
        src: l.src || 'API',
        msg: l.msg || 'Unknown event'
      }));
      logs = [...apiLogs, ...logs].slice(0, 100);
      renderLogs();
    }
  } catch (e) {
    console.error('Logs fetch error:', e);
    logs.unshift({ts: new Date().toLocaleTimeString(), lv: 'ERROR', src: 'System', msg: 'Unable to fetch backend logs (check API status)'});
    logs = logs.slice(0, 100);
    renderLogs();
  }
}

function addSystemLog(msg, level = 'INFO') {
  logs.unshift({
    ts: new Date().toLocaleTimeString(),
    lv: level,
    src: 'System',
    msg,
  });
  logs = logs.slice(0, 100);
  renderLogs();
}

for (let i = 0; i < 10; i++) {
  logs.push({ts: new Date().toLocaleTimeString(), lv: 'INFO', src: pick(SERVICES).name, msg: 'System operational'});
}

renderAll();

initCharts();

// Chatbot event listeners
document.getElementById('chat-send').addEventListener('click', handleChatSend);
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSend();
});
document.getElementById('voice-btn').addEventListener('click', startVoiceRecognition);

// Export button
document.getElementById('export-btn').addEventListener('click', exportReport);

setInterval(() => {
  SERVICES.forEach(s => {
    const st = serviceState[s.id];
    st.latency = s.bLat * (0.9 + Math.random() * 0.2);
    st.rps = s.bRps * (0.9 + Math.random() * 0.2);
    st.err = s.bErr * (0.9 + Math.random() * 0.2);
    st.spark = [...st.spark.slice(1), st.latency];
    st.sparkRps = [...st.sparkRps.slice(1), st.rps];
    st.sparkErr = [...st.sparkErr.slice(1), st.err];
  });
  renderMetricsBar();
  renderServiceCards();
  updateCharts();
  fetchMetricsFromAPI();
}, 1000);

setInterval(() => {
  if (startTime && phase !== 'standby') {
    elapsedMs = Date.now() - startTime;
    renderHeader();
  }

  fetchLogsFromAPI();

  // Add periodic system heartbeat logs
  if (Math.random() < 0.36) {
    addSystemLog('System heartbeat: platform healthy', 'INFO');
  }

  // Show predictive alert occasionally
  if (Math.random() < 0.05 && phase === 'standby') {
    showPredictiveAlert();
  }
}, 2000);