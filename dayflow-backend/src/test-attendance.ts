import prisma from './prisma';

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'jane@dayflow.com' } });
  if (!user) return console.log('no user');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('User ID:', user.id);
  console.log('Today:', today);
  console.log('Tomorrow:', tomorrow);

  const all = await prisma.attendance.findMany({ where: { userId: user.id } });
  console.log('All attendance:', all);

  const record = await prisma.attendance.findFirst({
    where: { userId: user.id, date: { gte: today, lt: tomorrow } },
  });
  console.log('Found with range:', record);
}

main().catch(console.error).finally(() => process.exit());
