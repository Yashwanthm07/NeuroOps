import { Router, Request, Response } from 'express';
import { queryMany } from '../../config/database';
import pino from 'pino';

const router = Router();
const logger = pino();

// GET /api/logs - Get logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const { level, service, limit = 100, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM logs WHERE 1=1';
    const params: any[] = [];

    if (level) {
      sql += ' AND level = $' + (params.length + 1);
      params.push(level);
    }

    if (service) {
      sql += ' AND service = $' + (params.length + 1);
      params.push(service);
    }

    sql += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit);
    params.push(offset);

    const logs = await queryMany(sql, params);
    res.json({ logs });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST /api/logs - Ingest logs
router.post('/', async (req: Request, res: Response) => {
  try {
    // This endpoint would be called by log shipping agents
    res.json({ success: true });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to ingest logs' });
  }
});

export default router;
