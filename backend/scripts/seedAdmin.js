import prisma from '../src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@searchlyst.com';
  const password = 'SuperAdmin!123';
  const name = 'Master Admin';

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    console.log(`Admin user ${email} already exists. Updating password...`);
    const password_hash = await bcrypt.hash(password, 10);
    await prisma.adminUser.update({
      where: { email },
      data: { password_hash }
    });
    console.log(`Password updated. Login: ${email} | Password: ${password}`);
  } else {
    console.log(`Creating admin user ${email}...`);
    const password_hash = await bcrypt.hash(password, 10);
    await prisma.adminUser.create({
      data: {
        email,
        password_hash,
        name
      }
    });
    console.log(`Admin created. Login: ${email} | Password: ${password}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
