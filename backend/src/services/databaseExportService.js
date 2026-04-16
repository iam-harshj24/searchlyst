import prisma from '../lib/prisma.js';

/**
 * Reads every table (full rows). Contains password hashes — treat as secret.
 */
export async function buildFullDatabaseExport() {
  const [
    users,
    adminUsers,
    waitlist,
    projects,
    contents,
    auditJobs,
    visibilityScans,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.adminUser.findMany(),
    prisma.waitlist.findMany(),
    prisma.project.findMany(),
    prisma.content.findMany(),
    prisma.auditJob.findMany(),
    prisma.visibilityScan.findMany(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    tables: {
      users,
      admin_users: adminUsers,
      waitlist,
      projects,
      contents,
      audit_jobs: auditJobs,
      visibility_scans: visibilityScans,
    },
  };
}
