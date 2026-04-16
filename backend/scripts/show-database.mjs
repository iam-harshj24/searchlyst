/**
 * Prints SQLite table names + sample rows (run: node scripts/show-database.mjs)
 */
import prisma from '../src/lib/prisma.js';

function trim(obj, maxLen = 200) {
  if (obj == null) return obj;
  if (typeof obj === 'string' && obj.length > maxLen) return obj.slice(0, maxLen) + '…';
  return obj;
}

function trimRow(row) {
  const o = { ...row };
  for (const k of Object.keys(o)) {
    if (typeof o[k] === 'string') o[k] = trim(o[k], 120);
  }
  return o;
}

async function main() {
  const tables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name
  `;
  console.log('Database file: set via DATABASE_URL (typically backend/prisma/dev.db)\n');
  console.log('=== TABLES ===');
  for (const t of tables) console.log(' ', t.name);

  const counts = [
    ['users', () => prisma.user.count()],
    ['projects', () => prisma.project.count()],
    ['visibility_scans', () => prisma.visibilityScan.count()],
    ['visibility_daily_snapshots', () => prisma.visibilityDailySnapshot.count()],
    ['competitor_daily_snapshots', () => prisma.competitorDailySnapshot.count()],
    ['engine_daily_snapshots', () => prisma.engineDailySnapshot.count()],
    ['category_daily_snapshots', () => prisma.categoryDailySnapshot.count()],
    ['citation_daily_snapshots', () => prisma.citationDailySnapshot.count()],
    ['audit_jobs', () => prisma.auditJob.count()],
    ['audit_daily_snapshots', () => prisma.auditDailySnapshot.count()],
    ['contents', () => prisma.content.count()],
    ['content_daily_stats', () => prisma.contentDailyStat.count()],
    ['waitlist', () => prisma.waitlist.count()],
    ['admin_users', () => prisma.adminUser.count()],
  ];
  console.log('\n=== ROW COUNTS ===');
  for (const [name, fn] of counts) {
    console.log(`  ${name.padEnd(32)} ${await fn()}`);
  }

  console.log('\n=== SAMPLE: users (up to 3) ===');
  console.log(
    JSON.stringify(
      (await prisma.user.findMany({ take: 3, orderBy: { id: 'asc' } })).map(trimRow),
      null,
      2,
    ),
  );

  console.log('\n=== SAMPLE: projects (up to 3) ===');
  console.log(
    JSON.stringify(
      (await prisma.project.findMany({ take: 3, orderBy: { id: 'asc' } })).map(trimRow),
      null,
      2,
    ),
  );

  console.log('\n=== SAMPLE: visibility_daily_snapshots (up to 2) ===');
  console.log(
    JSON.stringify(
      (await prisma.visibilityDailySnapshot.findMany({ take: 2, orderBy: { scanDate: 'desc' } })).map(
        trimRow,
      ),
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
