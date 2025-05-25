import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Function used to get event details
 */
export async function getEventHandler(req: Request, res: Response): Promise<void> {
  const event = await prisma.event.findFirst();

  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.json({
    totalSeats: event.totalSeats,
    seatsSold: event.seatsSold,
    seatsRemaining: event.remainingSeats,
  });
}


router.get('/', getEventHandler);

export default router;