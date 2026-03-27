import pino from 'pino';
import cron from 'node-cron';
import { getRedis } from '../config/redis';
import { CausalService, PlaybookService, IncidentService } from '../services';
import { queryMany } from '../config/database';

const logger = pino();
const causalService = new CausalService();
const playbookService = new PlaybookService();
const incidentService = new IncidentService();

export function startCausalAnalyzer() {
  // Run every 10 seconds
  cron.schedule('*/10 * * * * *', async () => {
    try {
      const redis = getRedis();
      
      // Get active incidents in detection phase
      const activeIncidents = await queryMany(
        `SELECT * FROM incidents WHERE status = 'active' AND phase = 'detection'`
      );

      for (const incident of activeIncidents) {
        try {
          // Build causal graph
          const causalGraph = await causalService.buildCausalGraph(incident.id);
          
          // Attribute root cause
          const attribution = await causalService.attributeRootCause(incident.id);
          
          // Generate playbook
          const playbook = await playbookService.generatePlaybook(incident.id, {
            root_cause_service: incident.target_service,
            blast_radius: incident.cascading_services,
            confidence: attribution.confidence,
          });

          // Update incident phase to attribution
          await incidentService.updateIncident(incident.id, {
            phase: 'attribution',
            confidence: attribution.confidence,
          });

          // Cache analysis results
          await redis.set(
            `incident:${incident.id}:analysis`,
            JSON.stringify({ causalGraph, attribution, playbook }),
            'EX',
            600
          );

          logger.info(`Causal analysis complete for incident ${incident.id}`);
        } catch (error) {
          logger.error(error, `Failed to analyze incident ${incident.id}`);
        }
      }
    } catch (error) {
      logger.error(error, 'Causal analyzer error');
    }
  });

  logger.info('✓ Causal analyzer started');
}

export default { startCausalAnalyzer };
