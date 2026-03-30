import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { email: 'harsh@gmail.com' },
    data: { password_hash: hashedPassword }
  });
  console.log('Password for harsh@gmail.com reset to: password123');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
