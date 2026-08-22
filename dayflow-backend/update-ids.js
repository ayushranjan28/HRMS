const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function updateIds() {
  const users = await prisma.user.findMany({ include: { privateInfo: true } });
  
  let i = 1;
  for (const u of users) {
    const parts = u.fullName.split(' ');
    const f2 = parts[0].substring(0, 2).toUpperCase();
    const l2 = (parts.length > 1 ? parts[1].substring(0, 2) : '').toUpperCase();
    const year = u.privateInfo ? new Date(u.privateInfo.dateOfJoining).getFullYear() : '2020';
    const serial = String(i++).padStart(4, '0');
    
    const newId = `OI${f2}${l2}${year}${serial}`;
    await prisma.user.update({
      where: { id: u.id },
      data: { employeeId: newId }
    });
    console.log(`Updated ${u.fullName} to ${newId}`);
  }
}
updateIds().then(() => process.exit(0));
