import { Request, Response } from 'express';
import { getStatsHandler } from '../src/routes/stats.route';

describe('getStatsHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = {};
    jsonMock = jest.fn();
    res = { json: jsonMock };
  });

  it('should respond with correct stats', () => {
    getStatsHandler(req as Request, res as Response);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestCount: expect.any(Number),
        successCount: expect.any(Number),
        failCount: expect.any(Number),
        p95LatencyMs: expect.any(Number),
      })
    );
  });
});
