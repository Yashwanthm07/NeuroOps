import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryMany, queryOne, query } from '../../config/database';
import pino from 'pino';

const router = Router();
const logger = pino();

// GET /api/playbooks - List playbooks
router.get('/', async (_req: Request, res: Response) => {
  try {
    const playbooks = await queryMany('SELECT * FROM playbooks ORDER BY created_at DESC');
    return res.json({ playbooks });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Failed to fetch playbooks' });
  }
});

// GET /api/playbooks/:id - Get playbook details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const playbook = await queryOne('SELECT * FROM playbooks WHERE id = $1', [req.params.id]);
    if (!playbook) {
      return res.status(404).json({ error: 'Playbook not found' });
    }
    return res.json(playbook);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Failed to fetch playbook' });
  }
});

// POST /api/playbooks - Create playbook
router.post('/', async (req: Request, res: Response) => {
  try {
    const { incident_id, root_cause, blast_radius, remediation_steps, prevention_measures, confidence } = req.body;
    
    const id = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO playbooks (id, incident_id, root_cause, blast_radius, remediation_steps, prevention_measures, confidence, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, incident_id, root_cause, JSON.stringify(blast_radius), JSON.stringify(remediation_steps), JSON.stringify(prevention_measures), confidence, now]
    );

    const playbook = await queryOne('SELECT * FROM playbooks WHERE id = $1', [id]);
    res.status(201).json(playbook);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to create playbook' });
  }
});

export default router;
