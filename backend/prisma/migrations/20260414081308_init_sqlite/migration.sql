-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'local',
    "google_id" TEXT,
    "name" TEXT NOT NULL,
    "role_type" TEXT DEFAULT 'founder',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "last_login" DATETIME
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website_url" TEXT,
    "source" TEXT,
    "status" TEXT DEFAULT 'pending',
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "brandName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "industry" TEXT,
    "companySize" TEXT,
    "location" TEXT,
    "trackingLocations" TEXT,
    "language" TEXT,
    "reach" TEXT,
    "competitors" TEXT,
    "target_audience" TEXT,
    "social_linkedin" TEXT,
    "social_instagram" TEXT,
    "social_substack" TEXT,
    "social_reddit" TEXT,
    "social_twitter" TEXT,
    "social_youtube" TEXT,
    "social_quora" TEXT,
    "social_tiktok" TEXT,
    "socialIngestSnapshot" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "topic" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'Blog',
    "title" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" TEXT,
    "results" TEXT,
    "error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visibility_scans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "brandName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "industry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" TEXT,
    "allRuns" TEXT,
    "results" TEXT,
    "error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visibility_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visibility_scans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visibility_daily_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scanId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "brandName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "scanDate" DATETIME NOT NULL,
    "overallScore" REAL,
    "visibilityScore" REAL,
    "sovScore" REAL,
    "positionScore" REAL,
    "sentimentScore" REAL,
    "totalRuns" INTEGER,
    "uniquePrompts" INTEGER,
    "mentionedIn" INTEGER,
    "promptCoverage" REAL,
    "promptsReached" INTEGER,
    "totalPrompts" INTEGER,
    "industryRank" INTEGER,
    "sentimentTrendPct" REAL,
    "effortTrendPct" REAL,
    "brandSov" REAL,
    "brandMentions" INTEGER,
    "brandAvgPosition" REAL,
    "brandSentiment" REAL,
    "totalEntityMentions" INTEGER,
    "sentimentPositivePct" REAL,
    "sentimentNeutralPct" REAL,
    "sentimentNegativePct" REAL,
    "sentimentPositiveCount" INTEGER,
    "sentimentNeutralCount" INTEGER,
    "sentimentNegativeCount" INTEGER,
    "sentimentIndex" REAL,
    "sentimentTotal" INTEGER,
    "perplexityScore" REAL,
    "perplexityRuns" INTEGER,
    "perplexityMentions" INTEGER,
    "geminiScore" REAL,
    "geminiRuns" INTEGER,
    "geminiMentions" INTEGER,
    "chatgptScore" REAL,
    "chatgptRuns" INTEGER,
    "chatgptMentions" INTEGER,
    "googleAIScore" REAL,
    "googleAIRuns" INTEGER,
    "googleAIMentions" INTEGER,
    "totalCitations" INTEGER,
    "totalCitedUrls" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "competitor_daily_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scanId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "brandDomain" TEXT NOT NULL,
    "scanDate" DATETIME NOT NULL,
    "competitorName" TEXT NOT NULL,
    "competitorDomain" TEXT,
    "isTargetBrand" BOOLEAN NOT NULL DEFAULT false,
    "sov" REAL,
    "mentions" INTEGER,
    "avgPosition" REAL,
    "sentiment" REAL,
    "promptCoverage" REAL,
    "industryRank" INTEGER,
    "sentimentIndex" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "engine_daily_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scanId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "domain" TEXT NOT NULL,
    "scanDate" DATETIME NOT NULL,
    "engine" TEXT NOT NULL,
    "score" REAL,
    "runs" INTEGER,
    "mentions" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "category_daily_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scanId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "domain" TEXT NOT NULL,
    "scanDate" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "score" REAL,
    "mentioned" INTEGER,
    "total" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "citation_daily_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scanId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "brandDomain" TEXT NOT NULL,
    "scanDate" DATETIME NOT NULL,
    "citedDomain" TEXT NOT NULL,
    "category" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "uniqueUrls" INTEGER,
    "isTargetBrand" BOOLEAN NOT NULL DEFAULT false,
    "isCompetitor" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_daily_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "auditId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "auditDate" DATETIME NOT NULL,
    "overallScore" REAL,
    "seoScore" REAL,
    "perfScore" REAL,
    "a11yScore" REAL,
    "issuesTotal" INTEGER,
    "crawledPages" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "content_daily_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "statDate" DATETIME NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'Blog',
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "published" INTEGER NOT NULL DEFAULT 0,
    "draft" INTEGER NOT NULL DEFAULT 0,
    "archived" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_email_idx" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_email_idx" ON "waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_status_idx" ON "waitlist"("status");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_userId_domain_key" ON "projects"("userId", "domain");

-- CreateIndex
CREATE INDEX "contents_userId_idx" ON "contents"("userId");

-- CreateIndex
CREATE INDEX "contents_projectId_idx" ON "contents"("projectId");

-- CreateIndex
CREATE INDEX "audit_jobs_userId_idx" ON "audit_jobs"("userId");

-- CreateIndex
CREATE INDEX "audit_jobs_projectId_idx" ON "audit_jobs"("projectId");

-- CreateIndex
CREATE INDEX "visibility_scans_userId_idx" ON "visibility_scans"("userId");

-- CreateIndex
CREATE INDEX "visibility_scans_projectId_idx" ON "visibility_scans"("projectId");

-- CreateIndex
CREATE INDEX "visibility_scans_projectId_created_at_idx" ON "visibility_scans"("projectId", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "visibility_daily_snapshots_scanId_key" ON "visibility_daily_snapshots"("scanId");

-- CreateIndex
CREATE INDEX "visibility_daily_snapshots_userId_scanDate_idx" ON "visibility_daily_snapshots"("userId", "scanDate");

-- CreateIndex
CREATE INDEX "visibility_daily_snapshots_projectId_scanDate_idx" ON "visibility_daily_snapshots"("projectId", "scanDate");

-- CreateIndex
CREATE INDEX "visibility_daily_snapshots_domain_scanDate_idx" ON "visibility_daily_snapshots"("domain", "scanDate");

-- CreateIndex
CREATE INDEX "visibility_daily_snapshots_scanDate_idx" ON "visibility_daily_snapshots"("scanDate");

-- CreateIndex
CREATE INDEX "competitor_daily_snapshots_scanId_idx" ON "competitor_daily_snapshots"("scanId");

-- CreateIndex
CREATE INDEX "competitor_daily_snapshots_userId_scanDate_idx" ON "competitor_daily_snapshots"("userId", "scanDate");

-- CreateIndex
CREATE INDEX "competitor_daily_snapshots_projectId_scanDate_idx" ON "competitor_daily_snapshots"("projectId", "scanDate");

-- CreateIndex
CREATE INDEX "competitor_daily_snapshots_brandDomain_competitorName_scanDate_idx" ON "competitor_daily_snapshots"("brandDomain", "competitorName", "scanDate");

-- CreateIndex
CREATE INDEX "engine_daily_snapshots_scanId_idx" ON "engine_daily_snapshots"("scanId");

-- CreateIndex
CREATE INDEX "engine_daily_snapshots_userId_engine_scanDate_idx" ON "engine_daily_snapshots"("userId", "engine", "scanDate");

-- CreateIndex
CREATE INDEX "engine_daily_snapshots_projectId_engine_scanDate_idx" ON "engine_daily_snapshots"("projectId", "engine", "scanDate");

-- CreateIndex
CREATE INDEX "category_daily_snapshots_scanId_idx" ON "category_daily_snapshots"("scanId");

-- CreateIndex
CREATE INDEX "category_daily_snapshots_userId_category_scanDate_idx" ON "category_daily_snapshots"("userId", "category", "scanDate");

-- CreateIndex
CREATE INDEX "category_daily_snapshots_projectId_category_scanDate_idx" ON "category_daily_snapshots"("projectId", "category", "scanDate");

-- CreateIndex
CREATE INDEX "citation_daily_snapshots_scanId_idx" ON "citation_daily_snapshots"("scanId");

-- CreateIndex
CREATE INDEX "citation_daily_snapshots_userId_scanDate_idx" ON "citation_daily_snapshots"("userId", "scanDate");

-- CreateIndex
CREATE INDEX "citation_daily_snapshots_projectId_scanDate_idx" ON "citation_daily_snapshots"("projectId", "scanDate");

-- CreateIndex
CREATE INDEX "citation_daily_snapshots_brandDomain_citedDomain_scanDate_idx" ON "citation_daily_snapshots"("brandDomain", "citedDomain", "scanDate");

-- CreateIndex
CREATE UNIQUE INDEX "audit_daily_snapshots_auditId_key" ON "audit_daily_snapshots"("auditId");

-- CreateIndex
CREATE INDEX "audit_daily_snapshots_userId_auditDate_idx" ON "audit_daily_snapshots"("userId", "auditDate");

-- CreateIndex
CREATE INDEX "audit_daily_snapshots_projectId_auditDate_idx" ON "audit_daily_snapshots"("projectId", "auditDate");

-- CreateIndex
CREATE INDEX "audit_daily_snapshots_domain_auditDate_idx" ON "audit_daily_snapshots"("domain", "auditDate");

-- CreateIndex
CREATE INDEX "content_daily_stats_userId_statDate_idx" ON "content_daily_stats"("userId", "statDate");

-- CreateIndex
CREATE INDEX "content_daily_stats_projectId_statDate_idx" ON "content_daily_stats"("projectId", "statDate");

-- CreateIndex
CREATE UNIQUE INDEX "content_daily_stats_userId_projectId_statDate_platform_key" ON "content_daily_stats"("userId", "projectId", "statDate", "platform");
