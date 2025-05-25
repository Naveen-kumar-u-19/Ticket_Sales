import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Function used to handle purchase
 */
export async function handlePurchase(req: Request, res: Response): Promise<void> {
  const quantity = parseInt(req.body.quantity);
  const idempotencyKey = req.header('Idempotency-Key');

  if (!quantity || quantity < 1 || quantity > 10) {
    res.status(400).json({ error: 'Invalid quantity' });
    return;
  }

  if (!idempotencyKey) {
    res.status(400).json({ error: 'Idempotency-Key header is required' });
    return;
  }

  const existing = await prisma.purchase.findUnique({ where: { idempotencyKey } });
  if (existing) {
    res.json({ success: true, seatsRemaining: await getRemainingSeats() });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Lock the row using raw SQL
      const lockedEvent = await tx.$queryRawUnsafe<any>(
        `SELECT * FROM "Event" WHERE id = 1 FOR UPDATE`
      );

      const event = lockedEvent[0];

      if (!event || event.remainingSeats < quantity) {
        throw new Error('SOLD_OUT');
      }

      await tx.event.update({
        where: { id: 1 },
        data: {
          seatsSold: { increment: quantity },
          remainingSeats: { decrement: quantity },
        },
      });

      await tx.purchase.create({
        data: {
          quantity,
          idempotencyKey,
          eventId: 1,
        },
      });
    });

    res.json({ success: true, seatsRemaining: await getRemainingSeats() });
  } catch (err) {
    if (err instanceof Error && err.message === 'SOLD_OUT') {
      res.status(409).json({ error: 'SOLD_OUT' });
      return;
    }

    console.error('Error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}

async function getRemainingSeats() {
  const event = await prisma.event.findFirst();
  return event?.remainingSeats || 0;
}

router.post('/', handlePurchase);

export default router;
