import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'demo12345';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash },
  });

  const existingCount = await prisma.playbook.count({ where: { userId: user.id } });
  if (existingCount === 0) {
    await prisma.playbook.createMany({
      data: [
        {
          userId: user.id,
          name: 'Contain Malware Outbreak',
          trigger: 'MALWARE_DETECTED',
          actions: ['ISOLATE_HOST', 'NOTIFY_ADMIN'],
        },
        {
          userId: user.id,
          name: 'Suspicious Login Response',
          trigger: 'LOGIN_ATTEMPT',
          actions: ['NOTIFY_ADMIN'],
        },
        {
          userId: user.id,
          name: 'Phishing Lockdown',
          trigger: 'PHISHING_ALERT',
          actions: ['BLOCK_IP', 'NOTIFY_ADMIN', 'ISOLATE_HOST'],
        },
      ],
    });
  }

  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
