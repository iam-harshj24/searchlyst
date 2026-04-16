/**
 * Renders the full database as HTML tables (open in any browser).
 * Usage: npm run db:export:html
 * Output: backend/exports/searchlyst-tables-<timestamp>.html
 */
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import prisma from '../src/lib/prisma.js';
import { buildFullDatabaseExport } from '../src/services/databaseExportService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'exports');

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCellValue(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

function collectKeys(rows) {
  const keys = new Set();
  for (const row of rows) {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => keys.add(k));
    }
  }
  return [...keys].sort();
}

function tableHtml(name, rows) {
  if (!rows.length) {
    return `<section class="tbl-wrap"><h2>${escapeHtml(name)} <span class="count">0 rows</span></h2><p class="empty">No rows</p></section>`;
  }
  const keys = collectKeys(rows);
  const header = keys.map((k) => `<th>${escapeHtml(k)}</th>`).join('');
  const body = rows
    .map((row) => {
      const tds = keys.map((k) => {
        const raw = formatCellValue(row[k]);
        const isLong = raw.length > 200 || raw.includes('\n');
        const inner = isLong
          ? `<pre class="cell-json">${escapeHtml(raw)}</pre>`
          : escapeHtml(raw);
        return `<td>${inner}</td>`;
      });
      return `<tr>${tds.join('')}</tr>`;
    })
    .join('');
  return `<section class="tbl-wrap" id="${escapeHtml(name)}">
  <h2>${escapeHtml(name)} <span class="count">${rows.length} rows</span></h2>
  <div class="scroll">
    <table>
      <thead><tr>${header}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>
</section>`;
}

function buildPage(data) {
  const nav = Object.keys(data.tables)
    .map((name) => `<a href="#${escapeHtml(name)}">${escapeHtml(name)}</a>`)
    .join(' · ');
  const sections = Object.entries(data.tables)
    .map(([name, rows]) => tableHtml(name, rows))
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Searchlyst database — ${escapeHtml(data.exportedAt)}</title>
  <style>
    :root { font-family: system-ui, Segoe UI, sans-serif; background: #f4f4f5; color: #18181b; }
    body { margin: 0; padding: 1rem 1.5rem 3rem; max-width: 100%; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .meta { color: #71717a; font-size: 0.875rem; margin-bottom: 1rem; }
    nav { margin-bottom: 2rem; line-height: 1.8; font-size: 0.9rem; }
    nav a { color: #2563eb; }
    .tbl-wrap { margin-bottom: 2.5rem; background: #fff; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
    .tbl-wrap h2 { margin: 0 0 0.75rem; font-size: 1.1rem; }
    .count { font-weight: normal; color: #71717a; font-size: 0.85rem; }
    .empty { color: #71717a; margin: 0; }
    .scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { border-collapse: collapse; width: 100%; font-size: 0.8rem; }
    th, td { border: 1px solid #e4e4e7; padding: 0.4rem 0.5rem; text-align: left; vertical-align: top; }
    th { background: #fafafa; position: sticky; top: 0; z-index: 1; white-space: nowrap; }
    tr:nth-child(even) td { background: #fafafa; }
    .cell-json { margin: 0; max-height: 12rem; overflow: auto; white-space: pre-wrap; word-break: break-word; font-size: 0.75rem; font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <h1>Searchlyst database (all tables)</h1>
  <p class="meta">Exported at ${escapeHtml(data.exportedAt)} · Contains sensitive data — do not share publicly.</p>
  <nav>${nav}</nav>
  ${sections}
</body>
</html>`;
}

const data = await buildFullDatabaseExport();
const html = buildPage(data);
const fname = `searchlyst-tables-${data.exportedAt.replace(/[:.]/g, '-')}.html`;
const outPath = path.join(outDir, fname);

await mkdir(outDir, { recursive: true });
await writeFile(outPath, html, 'utf8');
await prisma.$disconnect();

console.log(`Wrote HTML report:\n  ${outPath}`);
console.log('Open that file in your browser to see every row in table format.');
