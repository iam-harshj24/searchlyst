/**
 * Dump all PostgreSQL data (via Prisma) to a JSON file on disk.
 * Uses DATABASE_URL from backend/.env — point it at your live DB to download production data.
 *
 * Usage (from backend folder): npm run db:export
 * Output: backend/exports/searchlyst-full-export-<iso>.json
 */
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import prisma from '../src/lib/prisma.js';
import { buildFullDatabaseExport } from '../src/services/databaseExportService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'exports');

const data = await buildFullDatabaseExport();
const fname = `searchlyst-full-export-${data.exportedAt.replace(/[:.]/g, '-')}.json`;
const outPath = path.join(outDir, fname);

await mkdir(outDir, { recursive: true });
await writeFile(outPath, JSON.stringify(data, null, 2), 'utf8');
await prisma.$disconnect();

console.log(`Exported ${Object.keys(data.tables).length} tables to:\n  ${outPath}`);
console.log(
  'Row counts:',
  Object.fromEntries(
    Object.entries(data.tables).map(([k, rows]) => [k, Array.isArray(rows) ? rows.length : 0]),
  ),
);
