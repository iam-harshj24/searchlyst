import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'harsh@gmail.com';
  const password = 'harsh1234';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password_hash: hashedPassword,
      name: 'Harsh',
      onboarded: true,
      role_type: 'founder'
    },
    create: {
      email,
      password_hash: hashedPassword,
      name: 'Harsh',
      onboarded: true,
      auth_provider: 'local',
      role_type: 'founder'
    }
  });

  console.log(`Bypass credentials created successfully: ${user.email} / ${password}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
