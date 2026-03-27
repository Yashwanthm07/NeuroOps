import pino from 'pino';
import cron from 'node-cron';
import { getRedis } from '../config/redis';
import { IncidentService } from '../services';
import { queryMany } from '../config/database';

const logger = pino();
const incidentService = new IncidentService();

export function startRemediationExecutor() {
  // Run every 15 seconds
  cron.schedule('*/15 * * * * *', async () => {
    try {
      const redis = getRedis();
      
      // Get incidents in remediation phase
      const remediating = await queryMany(
        `SELECT * FROM incidents WHERE status = 'active' AND phase = 'remediation'`
      );

      for (const incident of remediating) {
        try {
          // Get playbook analysis
          const analysisJson = await redis.get(`incident:${incident.id}:analysis`);
          if (!analysisJson) continue;

          const { playbook } = JSON.parse(analysisJson);

          // Execute remediation steps (mock execution)
          logger.info(`Executing remediation for ${incident.id}`);
          
          // Simulate remediation
          await new Promise(r => setTimeout(r, 2000));

          // Update incident to learning phase
          await incidentService.updateIncident(incident.id, {
            phase: 'learning',
          });

          logger.info(`Remediation complete for ${incident.id}`);
        } catch (error) {
          logger.error(error, `Failed to remediate ${incident.id}`);
        }
      }
    } catch (error) {
      logger.error(error, 'Remediation executor error');
    }
  });

  logger.info('✓ Remediation executor started');
}

export default { startRemediationExecutor };
