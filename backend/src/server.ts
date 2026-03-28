import express, { Express, Request, Response, NextFunction } from 'express';
// Prometheus metrics
import client from 'prom-client';
// OpenTelemetry tracing
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import cors from 'cors';
import pino from 'pino';
import config from './config';
import { getConnection, closePool } from './config/database';
import { getRedis, closeRedis } from './config/redis';

// Routes
import incidentRoutes from './api/routes/incidents';
import metricsRoutes from './api/routes/metrics';
import servicesRoutes from './api/routes/services';
import playbooksRoutes from './api/routes/playbooks';
import logsRoutes from './api/routes/logs';

// Workers
import { startIncidentDetector } from './workers/incident-detector';
import { startCausalAnalyzer } from './workers/causal-analyzer';


// --- OpenTelemetry Tracing Init ---
const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// --- Prometheus Metrics Init ---
client.collectDefaultMetrics();

const logger = pino({ level: config.logging.level });

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(helmet());
  
  // Logging Middleware
  app.use(pinoHttp({ logger }));

  // CORS
  app.use(cors({ origin: '*', credentials: true }));

  // Body Parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
  app.use('/api/', limiter);

  // Health Check
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const db = getConnection();
      await db.query('SELECT NOW()');
      const redis = getRedis();
      await redis.ping();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.5.0',
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // API Routes
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/services', servicesRoutes);
  app.use('/api/playbooks', playbooksRoutes);
  app.use('/api/logs', logsRoutes);

  // Prometheus metrics endpoint
  app.get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.env === 'development' ? err.message : undefined,
    });
  });

  return app;
}

export async function startServer(): Promise<void> {
  try {
    const app = createApp();

    // Initialize database connection
    const db = getConnection();
    await db.query('SELECT NOW()');
    logger.info('✓ Database connected');

    // Initialize Redis connection
    const redis = getRedis();
    await redis.ping();
    logger.info('✓ Redis connected');

    // Start background workers
    startIncidentDetector();
    startCausalAnalyzer();
    logger.info('✓ Background workers started');

    // Start server
    app.listen(config.port, config.apiHost, () => {
      logger.info(`✓ NeuroOps API server running on http://${config.apiHost}:${config.port}`);
      logger.info(`✓ Environment: ${config.env}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await closePool();
      await closeRedis();
      process.exit(0);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}
