-- AlterTable: Add projectId and industry to visibility_scans
ALTER TABLE "visibility_scans" ADD COLUMN IF NOT EXISTS "projectId" INTEGER;
ALTER TABLE "visibility_scans" ADD COLUMN IF NOT EXISTS "industry" TEXT;

-- AlterTable: Add projectId to audit_jobs
ALTER TABLE "audit_jobs" ADD COLUMN IF NOT EXISTS "projectId" INTEGER;

-- CreateIndex: unique_user_domain on projects
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_domain" ON "projects"("userId", "domain");

-- AddForeignKey: visibility_scans.projectId -> projects.id
ALTER TABLE "visibility_scans" DROP CONSTRAINT IF EXISTS "visibility_scans_projectId_fkey";
ALTER TABLE "visibility_scans" ADD CONSTRAINT "visibility_scans_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: audit_jobs.projectId -> projects.id
ALTER TABLE "audit_jobs" DROP CONSTRAINT IF EXISTS "audit_jobs_projectId_fkey";
ALTER TABLE "audit_jobs" ADD CONSTRAINT "audit_jobs_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_scan_project" ON "visibility_scans"("projectId");
CREATE INDEX IF NOT EXISTS "idx_scan_project_date" ON "visibility_scans"("projectId", "created_at");
CREATE INDEX IF NOT EXISTS "idx_audit_project" ON "audit_jobs"("projectId");
