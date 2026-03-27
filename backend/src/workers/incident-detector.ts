import pino from 'pino';
import cron from 'node-cron';
import { getRedis } from '../config/redis';
import { AnomalyService, CausalService, IncidentService } from '../services';
import { queryMany, query } from '../config/database';

const logger = pino();
const anomalyService = new AnomalyService();
const causalService = new CausalService();
const incidentService = new IncidentService();

export function startIncidentDetector() {
  // Run every 5 seconds (default)
  cron.schedule('*/5 * * * * *', async () => {
    try {
      const services = await queryMany('SELECT id, name FROM services');
      const redis = getRedis();

      for (const service of services) {
        const anomalyScore = await anomalyService.detectAnomalies(service.id);

        // Threshold: 0.75
        if (anomalyScore > 0.75) {
          logger.warn(`Anomaly detected in ${service.name}: score=${anomalyScore}`);

          // Check if incident already exists for this service
          const existingIncident = await queryMany(
            `SELECT * FROM incidents WHERE target_service = $1 AND status = 'active'`,
            [service.id]
          );

          if (existingIncident.length === 0) {
            // Detect cascade
            const cascade = await anomalyService.detectCascade(service.id, services);
            
            // Create incident
            const incident = await incidentService.createIncident({
              id: `INC-${Date.now()}`,
              title: `Anomaly detected in ${service.name}`,
              description: `Anomaly score: ${anomalyScore}`,
              severity: anomalyScore > 0.9 ? 'critical' : 'high',
              target_service: service.id,
              cascading_services: cascade,
            });

            logger.info(`Created incident ${incident.id}`);
            await redis.set(`incident:${incident.id}:phase`, 'detection', 'EX', 600);
          }
        }
      }
    } catch (error) {
      logger.error(error, 'Incident detector error');
    }
  });

  logger.info('✓ Incident detector started');
}

export default { startIncidentDetector };
