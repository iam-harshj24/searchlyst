/**
 * Local SQLite seed:
 * - Dev user (login)
 * - Project, content, visibility scan + all snapshot tables
 * - Audit job + audit daily snapshot
 * - Content daily stat, waitlist row, optional admin user
 *
 * Run: npm run db:seed  |  Full reset: npm run db:reset
 * If DATABASE_URL in your shell overrides backend/.env, the wrong .db file may be targeted.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const SCAN_ID = 'seed-local-vscan-1';
const AUDIT_ID = 'seed-local-audit-1';

const email = (process.env.DEV_SEED_EMAIL || 'harsh@gmail.com').trim().toLowerCase();
const plainPassword = process.env.DEV_SEED_PASSWORD || 'harsh1234';
const name = process.env.DEV_SEED_NAME || 'Harsh';

const brandDomain = 'example-brand.com';
const scanDate = new Date('2026-04-14T12:00:00.000Z');
const auditDate = new Date('2026-04-14T14:00:00.000Z');
const statDate = new Date('2026-04-14T00:00:00.000Z');

async function wipeSeedArtifacts() {
  await prisma.citationDailySnapshot.deleteMany({ where: { scanId: SCAN_ID } });
  await prisma.categoryDailySnapshot.deleteMany({ where: { scanId: SCAN_ID } });
  await prisma.engineDailySnapshot.deleteMany({ where: { scanId: SCAN_ID } });
  await prisma.competitorDailySnapshot.deleteMany({ where: { scanId: SCAN_ID } });
  await prisma.visibilityDailySnapshot.deleteMany({ where: { scanId: SCAN_ID } });
  await prisma.visibilityScan.deleteMany({ where: { id: SCAN_ID } });

  await prisma.auditDailySnapshot.deleteMany({ where: { auditId: AUDIT_ID } });
  await prisma.auditJob.deleteMany({ where: { id: AUDIT_ID } });
}

async function main() {
  console.log(`[seed] DATABASE_URL=${process.env.DATABASE_URL ?? '(missing)'}`);

  const password_hash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      password_hash,
      auth_provider: 'local',
      role_type: 'founder',
      onboarded: true,
    },
    update: {
      password_hash,
      name,
      onboarded: true,
    },
  });

  console.log(`[seed] User id=${user.id} email=${user.email}`);

  const project = await prisma.project.upsert({
    where: { userId_domain: { userId: user.id, domain: brandDomain } },
    create: {
      userId: user.id,
      brandName: 'Example Brand',
      domain: brandDomain,
      industry: 'SaaS',
      companySize: '11-50',
      location: 'US',
      language: 'en',
      reach: 'national',
      competitors: JSON.stringify([{ name: 'Competitor Co', domain: 'competitor.com' }]),
    },
    update: {
      brandName: 'Example Brand',
      industry: 'SaaS',
    },
  });

  const seedTitle = 'Seed article — local DB check';
  const existingArticle = await prisma.content.findFirst({
    where: { userId: user.id, projectId: project.id, title: seedTitle },
  });
  if (!existingArticle) {
    await prisma.content.create({
      data: {
        userId: user.id,
        projectId: project.id,
        topic: 'AI visibility',
        platform: 'Blog',
        title: seedTitle,
        payload: '{"blocks":[]}',
        status: 'draft',
      },
    });
  }

  await wipeSeedArtifacts();

  await prisma.visibilityScan.create({
    data: {
      id: SCAN_ID,
      userId: user.id,
      projectId: project.id,
      brandName: project.brandName,
      domain: project.domain,
      industry: project.industry,
      status: 'completed',
      progress: '100',
      results: JSON.stringify({ seed: true, promptsSample: 3 }),
    },
  });

  await prisma.visibilityDailySnapshot.create({
    data: {
      scanId: SCAN_ID,
      userId: user.id,
      projectId: project.id,
      brandName: project.brandName,
      domain: project.domain,
      scanDate,
      overallScore: 72.5,
      visibilityScore: 70,
      sovScore: 18.2,
      positionScore: 65,
      sentimentScore: 0.82,
      totalRuns: 40,
      uniquePrompts: 10,
      mentionedIn: 8,
      promptCoverage: 0.8,
      industryRank: 4,
      sentimentPositivePct: 60,
      sentimentNeutralPct: 30,
      sentimentNegativePct: 10,
      sentimentIndex: 0.75,
      chatgptScore: 71,
      chatgptRuns: 10,
      chatgptMentions: 5,
      perplexityScore: 74,
      geminiScore: 69,
      googleAIScore: 73,
      totalCitations: 12,
      totalCitedUrls: 9,
    },
  });

  await prisma.competitorDailySnapshot.createMany({
    data: [
      {
        scanId: SCAN_ID,
        userId: user.id,
        projectId: project.id,
        brandDomain: project.domain,
        scanDate,
        competitorName: project.brandName,
        competitorDomain: project.domain,
        isTargetBrand: true,
        sov: 18.2,
        mentions: 24,
        avgPosition: 2.4,
        sentiment: 0.82,
        industryRank: 4,
      },
      {
        scanId: SCAN_ID,
        userId: user.id,
        projectId: project.id,
        brandDomain: project.domain,
        scanDate,
        competitorName: 'Competitor Co',
        competitorDomain: 'competitor.com',
        isTargetBrand: false,
        sov: 22.1,
        mentions: 30,
        avgPosition: 2.1,
        sentiment: 0.78,
        industryRank: 2,
      },
    ],
  });

  await prisma.engineDailySnapshot.createMany({
    data: ['chatgpt', 'perplexity', 'gemini', 'google_ai'].map((engine) => ({
      scanId: SCAN_ID,
      userId: user.id,
      projectId: project.id,
      domain: project.domain,
      scanDate,
      engine,
      score: 70 + engine.length % 5,
      runs: 10,
      mentions: 4 + (engine.length % 3),
    })),
  });

  await prisma.categoryDailySnapshot.createMany({
    data: [
      { category: 'Brand', score: 80, mentioned: 8, total: 10 },
      { category: 'Product', score: 65, mentioned: 5, total: 10 },
    ].map((c) => ({
      scanId: SCAN_ID,
      userId: user.id,
      projectId: project.id,
      domain: project.domain,
      scanDate,
      category: c.category,
      score: c.score,
      mentioned: c.mentioned,
      total: c.total,
    })),
  });

  await prisma.citationDailySnapshot.createMany({
    data: [
      {
        citedDomain: 'news.example.com',
        category: 'News',
        count: 3,
        uniqueUrls: 3,
        isTargetBrand: false,
        isCompetitor: false,
      },
      {
        citedDomain: project.domain,
        category: 'Official',
        count: 5,
        uniqueUrls: 4,
        isTargetBrand: true,
        isCompetitor: false,
      },
    ].map((c) => ({
      scanId: SCAN_ID,
      userId: user.id,
      projectId: project.id,
      brandDomain: project.domain,
      scanDate,
      citedDomain: c.citedDomain,
      category: c.category,
      count: c.count,
      uniqueUrls: c.uniqueUrls,
      isTargetBrand: c.isTargetBrand,
      isCompetitor: c.isCompetitor,
    })),
  });

  await prisma.auditJob.create({
    data: {
      id: AUDIT_ID,
      userId: user.id,
      projectId: project.id,
      url: `https://${project.domain}/`,
      status: 'completed',
      progress: '100',
      results: JSON.stringify({ issues: [], score: 82 }),
    },
  });

  await prisma.auditDailySnapshot.create({
    data: {
      auditId: AUDIT_ID,
      userId: user.id,
      projectId: project.id,
      url: `https://${project.domain}/`,
      domain: project.domain,
      auditDate,
      overallScore: 82,
      seoScore: 80,
      perfScore: 75,
      a11yScore: 88,
      issuesTotal: 5,
      crawledPages: 12,
    },
  });

  await prisma.contentDailyStat.upsert({
    where: {
      userId_projectId_statDate_platform: {
        userId: user.id,
        projectId: project.id,
        statDate,
        platform: 'Blog',
      },
    },
    create: {
      userId: user.id,
      projectId: project.id,
      statDate,
      platform: 'Blog',
      itemsCount: 3,
      published: 1,
      draft: 2,
      archived: 0,
    },
    update: {
      itemsCount: 3,
      published: 1,
      draft: 2,
      archived: 0,
    },
  });

  await prisma.waitlist.upsert({
    where: { email: 'seed.waitlist@example.local' },
    create: {
      full_name: 'Seed Waitlist',
      email: 'seed.waitlist@example.local',
      website_url: `https://${brandDomain}`,
      source: 'db_seed',
      status: 'pending',
    },
    update: { source: 'db_seed' },
  });

  const adminEmail = (process.env.DEV_SEED_ADMIN_EMAIL || 'admin@local.dev').trim().toLowerCase();
  const adminPass = process.env.DEV_SEED_ADMIN_PASSWORD || 'admin1234';
  const adminHash = await bcrypt.hash(adminPass, 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      password_hash: adminHash,
      name: 'Local Admin',
    },
    update: { password_hash: adminHash },
  });

  console.log('[seed] Wrote sample visibility + audit + snapshots + content stat + waitlist + admin.');
  console.log('[seed] Log in as dev user above; optional admin:', adminEmail);
}

main()
  .catch((e) => {
    console.error('[seed] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
