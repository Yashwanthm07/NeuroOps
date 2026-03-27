import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryMany, queryOne } from '../../config/database';
import { getRedis } from '../../config/redis';
import pino from 'pino';

const router = Router();
const logger = pino();

// GET /api/incidents - List all incidents
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM incidents';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit);
    params.push(offset);

    const incidents = await queryMany(sql, params);
    res.json({ incidents, total: incidents.length });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// GET /api/incidents/:id - Get incident details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const incident = await queryOne(
      'SELECT * FROM incidents WHERE id = $1',
      [req.params.id]
    );
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// POST /api/incidents - Create new incident
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, severity, target_service, cascading_services } = req.body;
    
    const id = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO incidents (id, title, description, severity, target_service, cascading_services, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, title, description, severity, target_service, JSON.stringify(cascading_services), 'active', now, now]
    );

    const incident = await queryOne('SELECT * FROM incidents WHERE id = $1', [id]);
    res.status(201).json(incident);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// POST /api/incidents/:id/trigger - Trigger incident
router.post('/:id/trigger', async (req: Request, res: Response) => {
  try {
    const incident = await queryOne(
      'SELECT * FROM incidents WHERE id = $1',
      [req.params.id]
    );
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Cache incident in Redis for workers
    const redis = getRedis();
    await redis.set(`incident:${incident.id}`, JSON.stringify({ ...incident, phase: 'injection' }), 'EX', 600);

    res.json({ success: true, incident });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to trigger incident' });
  }
});

// PUT /api/incidents/:id - Update incident
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, phase, confidence } = req.body;
    const now = new Date();

    await query(
      `UPDATE incidents SET status = COALESCE($1, status), phase = COALESCE($2, phase), 
       confidence = COALESCE($3, confidence), updated_at = $4 WHERE id = $5`,
      [status, phase, confidence, now, req.params.id]
    );

    const incident = await queryOne('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    res.json(incident);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// POST /api/incidents/:id/resolve - Resolve incident
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { resolution_notes, remediation_time } = req.body;
    const now = new Date();

    await query(
      `UPDATE incidents SET status = 'resolved', phase = 'resolved', resolved_at = $1, 
       resolution_notes = $2, remediation_time = $3, updated_at = $1 WHERE id = $4`,
      [now, resolution_notes, remediation_time, req.params.id]
    );

    const incident = await queryOne('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    res.json(incident);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
});

export default router;
