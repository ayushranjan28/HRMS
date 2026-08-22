const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function clear() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const res = await prisma.attendance.deleteMany({
    where: {
      date: { gte: today, lt: tomorrow }
    }
  });
  console.log("Deleted records:", res.count);
}
clear().then(() => process.exit(0));
