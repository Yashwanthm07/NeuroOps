// Services for incident management, causal analysis, and Claude AI integration

import pino from 'pino';
import { getRedis } from '../config/redis';
import { queryMany, queryOne } from '../config/database';

const logger = pino();

export class IncidentService {
  async getActiveIncidents() {
    return queryMany("SELECT * FROM incidents WHERE status = 'active' ORDER BY created_at DESC");
  }

  async getIncidentById(id: string) {
    return queryOne('SELECT * FROM incidents WHERE id = $1', [id]);
  }

  async createIncident(data: any) {
    const now = new Date();
    return queryOne(
      `INSERT INTO incidents (id, title, description, severity, target_service, cascading_services, status, phase, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.id, data.title, data.description, data.severity, data.target_service, JSON.stringify(data.cascading_services), 'active', 'injection', now]
    );
  }

  async updateIncident(id: string, data: any) {
    const now = new Date();
    return queryOne(
      `UPDATE incidents SET status = COALESCE($1, status), phase = COALESCE($2, phase), 
       confidence = COALESCE($3, confidence), updated_at = $4 WHERE id = $5 RETURNING *`,
      [data.status, data.phase, data.confidence, now, id]
    );
  }

  async resolveIncident(id: string, data: any) {
    const now = new Date();
    return queryOne(
      `UPDATE incidents SET status = 'resolved', phase = 'resolved', resolved_at = $1,
       remediation_time = $2, updated_at = $1 WHERE id = $3 RETURNING *`,
      [now, data.remediation_time, id]
    );
  }
}

export class MetricsService {
  async getServiceMetrics(serviceId: string, timeframeMs: number = 300000) {
    return queryMany(
      `SELECT * FROM metrics WHERE service_id = $1 AND recorded_at > NOW() - $2 * INTERVAL '1 millisecond'
       ORDER BY recorded_at DESC`,
      [serviceId, timeframeMs]
    );
  }

  async aggregateMetrics() {
    const redis = getRedis();
    const services = await queryMany('SELECT id FROM services');
    
    for (const service of services) {
      const metrics = await this.getServiceMetrics(service.id, 300000);
      if (metrics.length > 0) {
        const avg = {
          latency: metrics.reduce((sum: number, m: any) => sum + m.latency, 0) / metrics.length,
          rps: metrics.reduce((sum: number, m: any) => sum + m.rps, 0) / metrics.length,
          error_rate: metrics.reduce((sum: number, m: any) => sum + m.error_rate, 0) / metrics.length,
        };
        await redis.set(`metrics:${service.id}:agg`, JSON.stringify(avg), 'EX', 300);
      }
    }
  }
}

export class AnomalyService {
  async detectAnomalies(serviceId: string): Promise<number> {
    const redis = getRedis();
    const metricsJson = await redis.get(`metrics:${serviceId}:agg`);
    if (!metricsJson) return 0;

    const metrics = JSON.parse(metricsJson);
    // Simple anomaly scoring: 0-1
    const latencyScore = Math.min(metrics.latency / 1000, 1);
    const errorScore = Math.min(metrics.error_rate * 10, 1);
    const anomalyScore = (latencyScore + errorScore) / 2;

    return parseFloat(anomalyScore.toFixed(3));
  }

  async detectCascade(primaryService: string, allServices: any[]): Promise<string[]> {
    // Simple cascade detection based on dependencies
    const cascade: string[] = [];
    const deps = await queryMany(
      'SELECT dependent_service FROM service_dependencies WHERE service_id = $1',
      [primaryService]
    );

    cascade.push(...deps.map((d: any) => d.dependent_service));
    return cascade;
  }
}

export class CausalService {
  async buildCausalGraph(incidentId: string) {
    const incident = await queryOne('SELECT * FROM incidents WHERE id = $1', [incidentId]);
    if (!incident) throw new Error('Incident not found');

    // Build causal edge graph
    const edges: Array<{ from: string; to: string; weight: number }> = [];
    const deps = await queryMany(
      `SELECT s1.id as from_id, s2.id as to_id 
       FROM services s1 
       JOIN service_dependencies sd ON s1.id = sd.service_id
       JOIN services s2 ON sd.dependent_service = s2.id`
    );

    for (const dep of deps) {
      edges.push({ from: dep.from_id, to: dep.to_id, weight: Math.random() * 0.5 + 0.5 });
    }

    return { target: incident.target_service, edges, cascade: JSON.parse(incident.cascading_services || '[]') };
  }

  async attributeRootCause(incidentId: string): Promise<{ cause: string; confidence: number }> {
    // In a real system, this would use ML/PC-Algorithm
    // For now, returns the target service as root cause
    const incident = await queryOne('SELECT * FROM incidents WHERE id = $1', [incidentId]);
    return {
      cause: incident.target_service,
      confidence: 0.85 + Math.random() * 0.1,
    };
  }
}

export class PlaybookService {
  async generatePlaybook(incidentId: string, analysis: any) {
    const { root_cause_service, blast_radius, confidence } = analysis;
    
    return {
      id: `PB-2025-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
      incident_id: incidentId,
      root_cause: `Service ${root_cause_service} failure detected`,
      blast_radius,
      remediation_steps: [
        'Isolate affected service with circuit breaker',
        'Scale up service replicas to handle load',
        'Clear cache and warm up',
        'Health check and gradual traffic restore',
      ],
      prevention_measures: [
        'Implement resource limits per service',
        'Add exponential backoff retry logic',
        'Configure Prometheus alerts with thresholds',
      ],
      confidence,
    };
  }
}

export class ClaudeService {
  async analyzeIncident(incident: any): Promise<any> {
    // This would call Claude API
    // For demo purposes, returns mock analysis
    return {
      rootCause: `OOM on ${incident.target_service} service pod`,
      blastRadius: incident.cascading_services,
      confidence: 0.88 + Math.random() * 0.1,
      mttr_estimate: '12-15 seconds',
      remediationSteps: [
        `docker restart ${incident.target_service}`,
        'Scale replicas to 3',
        'Verify health probes',
        'Monitor metrics',
      ],
      preventionMeasures: [
        'Set memory limits on containers',
        'Implement circuit breakers',
        'Add livenessProbe checks',
      ],
      causalChain: `${incident.target_service} → ${incident.cascading_services.slice(0, 2).join(' → ')}`,
      playbookId: `PB-2025-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
    };
  }
}

export default {
  IncidentService,
  MetricsService,
  AnomalyService,
  CausalService,
  PlaybookService,
  ClaudeService,
};
