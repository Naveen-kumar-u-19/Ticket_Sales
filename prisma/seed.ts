import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.event.create({
    data: {
      totalSeats: 5000,
      seatsSold: 0,
      remainingSeats: 5000,
    },
  });

  console.log('Seeded event table with 5000 seats');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
