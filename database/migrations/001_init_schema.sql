-- Create tables for NeuroOps platform

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10),
  port INTEGER,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_dependencies (
  id SERIAL PRIMARY KEY,
  service_id VARCHAR(255) NOT NULL REFERENCES services(id),
  dependent_service VARCHAR(255) NOT NULL REFERENCES services(id),
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_id, dependent_service)
);

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(50),
  target_service VARCHAR(255) NOT NULL REFERENCES services(id),
  cascading_services JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  phase VARCHAR(100) DEFAULT 'standby',
  confidence FLOAT DEFAULT 0,
  root_cause TEXT,
  resolution_notes TEXT,
  remediation_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  INDEX idx_incidents_status (status),
  INDEX idx_incidents_phase (phase),
  INDEX idx_incidents_target_service (target_service)
);

CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  service_id VARCHAR(255) NOT NULL REFERENCES services(id),
  latency FLOAT,
  rps FLOAT,
  error_rate FLOAT,
  cpu FLOAT,
  memory FLOAT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metrics_service_time (service_id, recorded_at)
);

CREATE TABLE IF NOT EXISTS playbooks (
  id VARCHAR(255) PRIMARY KEY,
  incident_id VARCHAR(255) NOT NULL REFERENCES incidents(id),
  root_cause TEXT NOT NULL,
  blast_radius JSONB,
  remediation_steps JSONB,
  prevention_measures JSONB,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_playbooks_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  service VARCHAR(255),
  level VARCHAR(20),
  message TEXT,
  trace_id VARCHAR(255),
  span_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_level (level),
  INDEX idx_logs_service (service),
  INDEX idx_logs_timestamp (timestamp)
);

CREATE TABLE IF NOT EXISTS causal_analysis (
  id SERIAL PRIMARY KEY,
  incident_id VARCHAR(255) NOT NULL REFERENCES incidents(id),
  causal_graph JSONB,
  root_cause TEXT,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_causal_incident (incident_id)
);

-- Insert default services
INSERT INTO services (id, name, icon, port, status) VALUES
('gateway', 'API Gateway', '⬡', 3000, 'healthy'),
('auth', 'Auth Service', '🔐', 3001, 'healthy'),
('products', 'Product Catalog', '📦', 3002, 'healthy'),
('orders', 'Order Manager', '🧾', 3003, 'healthy'),
('payment', 'Payment Engine', '💳', 3004, 'healthy'),
('inventory', 'Inventory Sync', '🗄', 3005, 'healthy'),
('notification', 'Notifications', '🔔', 3006, 'healthy'),
('postgres', 'PostgreSQL', '🐘', 5432, 'healthy'),
('redis', 'Redis Cache', '⚡', 6379, 'healthy'),
('rabbitmq', 'RabbitMQ', '🐇', 5672, 'healthy')
ON CONFLICT DO NOTHING;

-- Insert service dependencies
INSERT INTO service_dependencies (service_id, dependent_service, weight) VALUES
('gateway', 'auth', 0.95),
('gateway', 'products', 0.90),
('gateway', 'orders', 0.85),
('gateway', 'payment', 0.88),
('gateway', 'inventory', 0.92),
('gateway', 'notification', 0.85),
('products', 'postgres', 0.95),
('products', 'redis', 0.70),
('orders', 'postgres', 0.95),
('orders', 'payment', 0.90),
('orders', 'inventory', 0.88),
('payment', 'postgres', 0.75),
('inventory', 'redis', 0.92),
('notification', 'rabbitmq', 0.95)
ON CONFLICT DO NOTHING;
