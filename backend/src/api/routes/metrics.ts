import { Router, Request, Response } from 'express';
import { queryMany, queryOne } from '../../config/database';
import pino from 'pino';

const router = Router();
const logger = pino();

// GET /api/metrics - Get aggregated metrics
router.get('/', async (req: Request, res: Response) => {
  try {
    const { service_id, timeframe = '1h' } = req.query;
    
    let sql = 'SELECT * FROM metrics WHERE 1=1';
    const params: any[] = [];

    if (service_id) {
      sql += ' AND service_id = $' + (params.length + 1);
      params.push(service_id);
    }

    sql += ' ORDER BY recorded_at DESC LIMIT 100';
    const metrics = await queryMany(sql, params);
    res.json({ metrics });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// POST /api/metrics - Record metrics
router.post('/', async (req: Request, res: Response) => {
  try {
    const { service_id, latency, rps, error_rate, cpu, memory } = req.body;
    const now = new Date();

    // This will be batched by the backend from Prometheus
    res.json({ success: true, recorded_at: now });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to record metrics' });
  }
});

// GET /api/metrics/timeseries - Get time-series data
router.get('/timeseries/:service_id', async (req: Request, res: Response) => {
  try {
    const { period = '1h' } = req.query;
    
    const data = await queryMany(
      `SELECT recorded_at, latency, rps, error_rate 
       FROM metrics 
       WHERE service_id = $1 AND recorded_at > NOW() - INTERVAL $2
       ORDER BY recorded_at ASC`,
      [req.params.service_id, period]
    );

    res.json({ data });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to fetch time-series data' });
  }
});

export default router;
