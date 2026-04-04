import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  console.log('Hashing passwords...');
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const analystPassword = await bcrypt.hash('analyst123', saltRounds);
  const viewerPassword = await bcrypt.hash('viewer123', saltRounds);

  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Analyst User',
      email: 'analyst@example.com',
      passwordHash: analystPassword,
      role: 'ANALYST',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Viewer User',
      email: 'viewer@example.com',
      passwordHash: viewerPassword,
      role: 'VIEWER',
      isActive: true,
    },
  });

  console.log('Creating financial records...');
  const categories = [
    'Software',
    'Hardware',
    'Marketing',
    'Consulting',
    'Salaries',
  ];

  for (let index = 0; index < 40; index += 1) {
    const isIncome = Math.random() > 0.6;
    const transactionDate = new Date();

    transactionDate.setMonth(
      transactionDate.getMonth() - Math.floor(Math.random() * 6),
    );
    transactionDate.setDate(Math.floor(Math.random() * 28) + 1);

    await prisma.financialRecord.create({
      data: {
        amountCents: Math.floor(Math.random() * 500000) + 1000,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        category: categories[Math.floor(Math.random() * categories.length)],
        notes: `Auto-generated seed record ${index + 1}`,
        transactionDate,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
