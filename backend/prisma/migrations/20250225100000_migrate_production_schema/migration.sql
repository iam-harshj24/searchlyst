-- Migration: Transform production DB from old schema to current schema
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS MIGRATION
-- This migration is DESTRUCTIVE: drops old tables (audit_issues, audits, brand_profiles, etc.)

-- Step 1: Drop foreign keys from tables we're about to drop/alter
ALTER TABLE "audit_issues" DROP CONSTRAINT IF EXISTS "audit_issues_audit_id_fkey";
ALTER TABLE "audits" DROP CONSTRAINT IF EXISTS "audits_project_id_fkey";
ALTER TABLE "brand_profiles" DROP CONSTRAINT IF EXISTS "brand_profiles_project_id_fkey";
ALTER TABLE "fetched_content" DROP CONSTRAINT IF EXISTS "fetched_content_social_connection_id_fkey";
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_user_id_fkey";
ALTER TABLE "sentiment_geo_results" DROP CONSTRAINT IF EXISTS "sentiment_geo_results_project_id_fkey";
ALTER TABLE "sentiment_geo_results" DROP CONSTRAINT IF EXISTS "sentiment_geo_results_tracked_prompt_id_fkey";
ALTER TABLE "social_connections" DROP CONSTRAINT IF EXISTS "social_connections_user_id_fkey";
ALTER TABLE "tracked_prompts" DROP CONSTRAINT IF EXISTS "tracked_prompts_project_id_fkey";

-- Step 2: Drop old tables (not used by current codebase)
DROP TABLE IF EXISTS "audit_issues";
DROP TABLE IF EXISTS "audits";
DROP TABLE IF EXISTS "brand_profiles";
DROP TABLE IF EXISTS "fetched_content";
DROP TABLE IF EXISTS "sentiment_geo_results";
DROP TABLE IF EXISTS "social_connections";
DROP TABLE IF EXISTS "tracked_prompts";

-- Step 3: Migrate users (full_name -> name, add role_type/onboarded)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;
UPDATE "users" SET "name" = COALESCE("full_name", "name", email);
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name";
ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_data";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_type" TEXT DEFAULT 'founder';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarded" BOOLEAN DEFAULT false;
UPDATE "users" SET "role_type" = COALESCE("role_type", 'founder');
UPDATE "users" SET "onboarded" = COALESCE("onboarded", false);
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE TEXT;
ALTER TABLE "users" ALTER COLUMN "password_hash" SET DATA TYPE TEXT;
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- Step 4: Migrate projects (old: user_id, name, url -> new: userId, brandName, domain)
-- Create new projects table with correct schema
CREATE TABLE "projects_new" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "brandName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "industry" TEXT,
    "companySize" TEXT,
    "location" TEXT,
    "language" TEXT,
    "reach" TEXT,
    "competitors" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_new_pkey" PRIMARY KEY ("id")
);
-- Migrate data: old columns may be user_id/userId, name, url
INSERT INTO "projects_new" ("userId", "brandName", "domain", "created_at", "updated_at")
SELECT 
    p.user_id,
    COALESCE(p.name, 'Unknown'),
    COALESCE(
        NULLIF(regexp_replace(regexp_replace(COALESCE(p.url, 'unknown.com'), '^https?://', '', 'i'), '^www\.', '', 'i'), ''),
        'unknown.com'
    ),
    COALESCE(p.created_at, CURRENT_TIMESTAMP),
    COALESCE(p.updated_at, CURRENT_TIMESTAMP)
FROM "projects" p;
DROP TABLE "projects";
ALTER TABLE "projects_new" RENAME TO "projects";
CREATE INDEX "idx_project_user" ON "projects"("userId");
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Alter admin_users (type adjustments)
ALTER TABLE "admin_users" ALTER COLUMN "email" SET DATA TYPE TEXT;
ALTER TABLE "admin_users" ALTER COLUMN "password_hash" SET DATA TYPE TEXT;
ALTER TABLE "admin_users" ALTER COLUMN "name" SET DATA TYPE TEXT;
ALTER TABLE "admin_users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "admin_users" ALTER COLUMN "last_login" SET DATA TYPE TIMESTAMP(3);

-- Step 6: Alter waitlist (type adjustments)
ALTER TABLE "waitlist" ALTER COLUMN "full_name" SET DATA TYPE TEXT;
ALTER TABLE "waitlist" ALTER COLUMN "email" SET DATA TYPE TEXT;
ALTER TABLE "waitlist" ALTER COLUMN "website_url" SET DATA TYPE TEXT;
ALTER TABLE "waitlist" ALTER COLUMN "source" SET DATA TYPE TEXT;
ALTER TABLE "waitlist" ALTER COLUMN "status" SET DATA TYPE TEXT;
ALTER TABLE "waitlist" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "waitlist" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- Step 7: Create audit_jobs and visibility_scans (new tables)
CREATE TABLE IF NOT EXISTS "audit_jobs" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" TEXT,
    "results" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "audit_jobs"("userId");
ALTER TABLE "audit_jobs" ADD CONSTRAINT "audit_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "visibility_scans" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "brandName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" TEXT,
    "allRuns" TEXT,
    "results" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visibility_scans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_scan_user" ON "visibility_scans"("userId");
ALTER TABLE "visibility_scans" ADD CONSTRAINT "visibility_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
