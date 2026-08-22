const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const records = await prisma.attendance.findMany();
  console.log(records);
}
check();
