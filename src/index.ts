import express from 'express';
import { PrismaClient } from '@prisma/client';
import purchaseRouter from './routes/purchase.route';
import eventRouter from './routes/event.route';
import statsRouter from './routes/stats.route';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.use('/event', eventRouter);
app.use('/purchase', purchaseRouter);
app.use('/stats', statsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;