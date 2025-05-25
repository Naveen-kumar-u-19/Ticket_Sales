import { Router, Request, Response } from 'express';

const router = Router();

let requestCount = 0;
let successCount = 0;
let failCount = 0;
const latencies: number[] = [];

router.use((req: Request, res: Response, next) => {
  const start = Date.now();
  requestCount++;
  res.on('finish', () => {
    const duration = Date.now() - start;
    latencies.push(duration);
    if (res.statusCode < 400) successCount++;
    else failCount++;
  });
  next();
});

/**
 * Function used to handle status of the request in running application
 */
export function getStatsHandler(req: Request, res: Response): void {
  const sorted = [...latencies].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(0.95 * sorted.length)] || 0;
  res.json({ requestCount, successCount, failCount, p95LatencyMs: p95 });
}

router.get('/', getStatsHandler);

export default router;
