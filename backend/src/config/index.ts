import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '3001', 10),
  apiHost: process.env.API_HOST || 'localhost',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'neuro_ops',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  },
  
  // Claude AI
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '1000', 10),
    enabled: process.env.ENABLE_CLAUDE_AI === 'true',
  },
  
  // Observability
  observability: {
    prometheus: {
      host: process.env.PROMETHEUS_HOST || 'localhost',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
    },
    loki: {
      host: process.env.LOKI_HOST || 'localhost',
      port: parseInt(process.env.LOKI_PORT || '3100', 10),
    },
    jaeger: {
      host: process.env.JAEGER_HOST || 'localhost',
      port: parseInt(process.env.JAEGER_PORT || '6831', 10),
    },
  },
  
  // Feature flags
  features: {
    enableClaudeAI: process.env.ENABLE_CLAUDE_AI === 'true',
    enableCausalAnalysis: process.env.ENABLE_CAUSAL_ANALYSIS === 'true',
    enableAutoRemediation: process.env.ENABLE_AUTO_REMEDIATION === 'true',
    enableGraphLearning: process.env.ENABLE_GRAPH_LEARNING === 'true',
  },
  
  // Thresholds
  thresholds: {
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '75'),
    sloThresholdMs: parseInt(process.env.SLO_THRESHOLD_MS || '15000', 10),
    anomalyThreshold: parseFloat(process.env.ANOMALY_THRESHOLD || '0.75'),
    metricWindowSize: parseInt(process.env.METRIC_WINDOW_SIZE || '300000', 10),
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  
  // Incident Detection
  incidentDetection: {
    interval: parseInt(process.env.INCIDENT_DETECTION_INTERVAL || '5000', 10),
  },
};

export default config;
