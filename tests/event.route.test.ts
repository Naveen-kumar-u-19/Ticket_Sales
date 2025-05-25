import { Request, Response } from 'express';
import { getEventHandler } from '../src/routes/event.route';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    event: {
      findFirst: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('getEventHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = {};
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('should respond with event data if event exists', async () => {
    const prismaEvent = {
      totalSeats: 200,
      seatsSold: 150,
      remainingSeats: 50,
    };
    const expectedResponse = {
      totalSeats: 200,
      seatsSold: 150,
      seatsRemaining: 50,
    };
    const prisma = new PrismaClient();
    (prisma.event.findFirst as jest.Mock).mockResolvedValue(prismaEvent);
    await getEventHandler(req as Request, res as Response);

    expect(prisma.event.findFirst).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(expectedResponse);
  });


  it('should respond with 404 if event not found', async () => {
    const prisma = new PrismaClient();
    (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);
    await getEventHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Event not found' });
  });
});
