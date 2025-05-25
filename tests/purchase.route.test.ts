// tests/purchase.route.test.ts
import { Request, Response } from 'express';
import { handlePurchase } from '../src/routes/purchase.route';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    purchase: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    event: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('handlePurchase', () => {
  let prisma: any;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    prisma = new PrismaClient();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    res = {
      status: statusMock,
      json: jsonMock,
    };

    req = {
      body: {},
      header: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if quantity invalid', async () => {
    req.body.quantity = '0';
    req.header = jest.fn(() => 'some-key') as any;
    await handlePurchase(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid quantity' });
  });

  it('returns 400 if Idempotency-Key header missing', async () => {
    req.body.quantity = '5';
    req.header = jest.fn(() => undefined);
    await handlePurchase(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Idempotency-Key header is required' });
  });

  it('returns success if purchase exists', async () => {
    req.body.quantity = '3';
    req.header = jest.fn(() => 'unique-key') as any;
    prisma.purchase.findUnique.mockResolvedValue({ idempotencyKey: 'unique-key' });
    prisma.event.findFirst.mockResolvedValue({ remainingSeats: 7 });

    await handlePurchase(req as Request, res as Response);

    expect(prisma.purchase.findUnique).toHaveBeenCalledWith({ where: { idempotencyKey: 'unique-key' } });
    expect(jsonMock).toHaveBeenCalledWith({ success: true, seatsRemaining: 7 });
  });

  it('handles successful purchase transaction', async () => {
    req.body.quantity = '2';
    req.header = jest.fn(() => 'key-123') as any;
    prisma.purchase.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: any) => {
      prisma.$queryRawUnsafe.mockResolvedValue([{ id: 1, remainingSeats: 5, seatsSold: 10 }]);
      await callback({
        $queryRawUnsafe: prisma.$queryRawUnsafe,
        event: {
          update: prisma.event.update,
        },
        purchase: {
          create: prisma.purchase.create,
        },
      });
    });

    prisma.event.update.mockResolvedValue({});
    prisma.purchase.create.mockResolvedValue({});
    prisma.event.findFirst.mockResolvedValue({ remainingSeats: 3 });
    await handlePurchase(req as Request, res as Response);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { seatsSold: { increment: 2 }, remainingSeats: { decrement: 2 } },
    });
    expect(prisma.purchase.create).toHaveBeenCalledWith({
      data: { quantity: 2, idempotencyKey: 'key-123', eventId: 1 },
    });
    expect(jsonMock).toHaveBeenCalledWith({ success: true, seatsRemaining: 3 });
  });

  it('returns 409 on SOLD_OUT error', async () => {
    req.body.quantity = '5';
    req.header = jest.fn(() => 'key-xyz') as any;
    prisma.purchase.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async () => {
      throw new Error('SOLD_OUT');
    });
    await handlePurchase(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'SOLD_OUT' });
  });

  it('returns 500 on unknown error', async () => {
    req.body.quantity = '5';
    req.header = jest.fn(() => 'key-xyz') as any;
    prisma.purchase.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async () => {
      throw new Error('UNKNOWN_ERROR');
    });
    console.error = jest.fn();
    await handlePurchase(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal error' });
  });
});
