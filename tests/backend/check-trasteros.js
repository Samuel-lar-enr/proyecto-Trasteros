import { PrismaClient } from '@prisma/client';

async function checkTrasteros() {
  const prisma = new PrismaClient();

  try {
    const count = await prisma.storageUnit.count();
    console.log('Total trasteros:', count);

    if (count > 0) {
      const trasteros = await prisma.storageUnit.findMany({
        take: 5,
        select: {
          id: true,
          number: true,
          location: true,
          typeId: true,
          m2: true,
          m3: true,
          observations: true,
          status: true
        }
      });
      console.log('Primeros 5 trasteros:');
      console.table(trasteros);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrasteros();