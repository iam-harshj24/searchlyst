/**
 * Verifies the local SQLite file exists and reports row counts for every Prisma model.
 * Run from backend: npm run db:verify
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function sqliteFilePath() {
  try {
    const rows = await prisma.$queryRaw`PRAGMA database_list`;
    const main = Array.isArray(rows) ? rows.find((r) => r.name === 'main') : null;
    return main?.file ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  console.log(`DATABASE_URL=${url || '(missing)'}`);

  const filePath = await sqliteFilePath();
  if (filePath) {
    console.log(`SQLite main file: ${filePath}`);
    if (!existsSync(filePath)) {
      console.error('ERROR: Database file path does not exist on disk.');
      process.exitCode = 1;
    }
  }

  const counts = {
    users: await prisma.user.count(),
    admin_users: await prisma.adminUser.count(),
    waitlist: await prisma.waitlist.count(),
    projects: await prisma.project.count(),
    contents: await prisma.content.count(),
    audit_jobs: await prisma.auditJob.count(),
    visibility_scans: await prisma.visibilityScan.count(),
    visibility_daily_snapshots: await prisma.visibilityDailySnapshot.count(),
    competitor_daily_snapshots: await prisma.competitorDailySnapshot.count(),
    engine_daily_snapshots: await prisma.engineDailySnapshot.count(),
    category_daily_snapshots: await prisma.categoryDailySnapshot.count(),
    citation_daily_snapshots: await prisma.citationDailySnapshot.count(),
    audit_daily_snapshots: await prisma.auditDailySnapshot.count(),
    content_daily_stats: await prisma.contentDailyStat.count(),
  };

  console.log('\nTable row counts:');
  const pad = (k) => String(k).padEnd(32);
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${pad(k)} ${v}`);
  }

  const required = [
    ['users', counts.users],
    ['projects', counts.projects],
    ['visibility_scans', counts.visibility_scans],
    ['visibility_daily_snapshots', counts.visibility_daily_snapshots],
    ['competitor_daily_snapshots', counts.competitor_daily_snapshots],
    ['engine_daily_snapshots', counts.engine_daily_snapshots],
    ['category_daily_snapshots', counts.category_daily_snapshots],
    ['citation_daily_snapshots', counts.citation_daily_snapshots],
    ['audit_jobs', counts.audit_jobs],
    ['audit_daily_snapshots', counts.audit_daily_snapshots],
    ['contents', counts.contents],
    ['content_daily_stats', counts.content_daily_stats],
    ['waitlist', counts.waitlist],
  ];

  const missing = required.filter(([, n]) => n < 1).map(([name]) => name);
  if (missing.length) {
    console.error(`\nFAIL: Expected at least 1 row after full seed for: ${missing.join(', ')}`);
    console.error('Run: npm run db:init   (or: npm run db:migrate:deploy && npm run db:seed)');
    process.exitCode = 1;
  } else {
    console.log('\nOK: All integrated tables have seed data (counts >= 1).');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
