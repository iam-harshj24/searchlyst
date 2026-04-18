/**
 * Seeds integration-test users when DEV_SEED_* env vars are set (see docker-compose.yml).
 * Called by scripts/entrypoint.sh before the API starts.
 */
import '../src/loadEnv.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seedUserEmail    = process.env.DEV_SEED_EMAIL           || 'testuser@integration.test';
const seedUserPassword = process.env.DEV_SEED_PASSWORD        || 'testpass1234';
const seedUserName     = process.env.DEV_SEED_NAME            || 'Test User';

const seedAdminEmail    = process.env.DEV_SEED_ADMIN_EMAIL    || 'admin@integration.test';
const seedAdminPassword = process.env.DEV_SEED_ADMIN_PASSWORD || 'adminpass1234';
const seedAdminName     = process.env.DEV_SEED_ADMIN_NAME     || 'Local Admin';

async function main() {
  const userHash  = await bcrypt.hash(seedUserPassword,  10);
  const adminHash = await bcrypt.hash(seedAdminPassword, 10);

  await prisma.user.upsert({
    where: { email: seedUserEmail },
    update: { password_hash: userHash, name: seedUserName, auth_provider: 'local' },
    create: {
      email: seedUserEmail,
      password_hash: userHash,
      name: seedUserName,
      auth_provider: 'local',
      role_type: 'user',
      onboarded: false,
    },
  });

  await prisma.adminUser.upsert({
    where: { email: seedAdminEmail },
    update: { password_hash: adminHash, name: seedAdminName },
    create: {
      email: seedAdminEmail,
      password_hash: adminHash,
      name: seedAdminName,
    },
  });

  console.log(`Seeded user  : ${seedUserEmail}`);
  console.log(`Seeded admin : ${seedAdminEmail}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
