/**
 * Build print-ready PDFs from docs/*.md
 * Run: npm run docs:pdf  (from repo root)
 * Requires: npm install (md-to-pdf devDependency; downloads Chromium once)
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { mdToPdf } = require('md-to-pdf');
import { readFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(__dirname, '..');
const outDir = join(__dirname, 'output');
/** Served live by Vite at /docs/*.pdf */
const publicDocsDir = join(__dirname, '..', '..', 'public', 'docs');
const cssPath = join(__dirname, 'pdf-theme.css');

const WHITE_PAPER = join(docsRoot, 'WHITE_PAPER_TECH_STACK_AND_METHODOLOGY.md');
const METHODOLOGY = join(docsRoot, 'SCORING_AND_SENTIMENT_METHODOLOGY.md');

/** Mermaid does not render in md-to-pdf; replace with a clear figure. */
const ARCHITECTURE_FIGURE = `
<h4 class="figure-caption">Figure 1 — System architecture (data flow)</h4>
<div class="figure-arch">┌──────────────────┐    ┌────────────────────┐    ┌────────────────────────────────────────┐
│  Web client      │───▶│  Express API       │───▶│  visibilityAgents                      │
│  React + Vite    │    │  visibilityCtrl    │    │  → Infatica → responseParser           │
└──────────────────┘    └─────────┬──────────┘    │  → scoringEngine (merge with allRuns)   │
                                  │               └──────────────────┬─────────────────────┘
                                  │                                  │
                                  ▼                                  ▼
                         ┌─────────────────┐                ┌──────────────────┐
                         │ Gemini          │                │ PostgreSQL +     │
                         │ batchDeepAnalysis│                │ Prisma           │
                         └─────────────────┘                └──────────────────┘</div>
`;

const COVER_WHITE_PAPER = `
<div class="pdf-cover">
  <h1>Technical White Paper</h1>
  <p class="subtitle">AI Visibility Platform</p>
  <p class="subtitle" style="font-size:11pt;margin-top:6mm;">End-to-end stack, data pipeline, and calculation methodology</p>
  <p class="meta">Document version 1.0 · April 2026</p>
  <p class="brand">Engineering &amp; product reference</p>
</div>
<div class="page-break"></div>
`;

const COVER_METHODOLOGY = `
<div class="pdf-cover">
  <h1>Scoring &amp; sentiment methodology</h1>
  <p class="subtitle">Formulas, weights, and UI consistency</p>
  <p class="meta">April 2026 · Companion to the technical white paper</p>
  <p class="brand">Canonical formula reference</p>
</div>
<div class="page-break"></div>
`;

function stripMermaid(md) {
    return md.replace(/```mermaid[\s\S]*?```/g, ARCHITECTURE_FIGURE.trim());
}

function fixDocLinks(md) {
    return md
        .replace(/\.\/SCORING_AND_SENTIMENT_METHODOLOGY\.md/g, 'Scoring & Sentiment Methodology (PDF)')
        .replace(/\.\/WHITE_PAPER_TECH_STACK_AND_METHODOLOGY\.md/g, 'Technical White Paper (PDF)');
}

async function buildOne({ input, outputName, preProcess, cover }) {
    let md = readFileSync(input, 'utf8');
    md = preProcess(md);
    md = cover + md;

    const destPath = join(outDir, outputName);
    const { filename } = await mdToPdf(
        { content: md },
        {
            dest: destPath,
            stylesheet: cssPath,
            sanitize: false,
            pdf_options: {
                format: 'A4',
                printBackground: true,
                margin: { top: '14mm', right: '14mm', bottom: '16mm', left: '14mm' },
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: `<div style="width:100%;font-size:8px;color:#888;text-align:center;font-family:system-ui,sans-serif;padding:0 10mm;">
                    <span style="float:left;">${outputName.replace('.pdf', '')}</span>
                    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
                </div>`,
            },
        },
    );
    if (!existsSync(publicDocsDir)) mkdirSync(publicDocsDir, { recursive: true });
    const publicPath = join(publicDocsDir, outputName);
    copyFileSync(destPath, publicPath);
    console.log('  Written:', filename);
    console.log('  → Live URL path: /docs/' + outputName);
}

async function main() {
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    console.log('Building PDFs into docs/pdf/output/ …\n');

    await buildOne({
        input: WHITE_PAPER,
        outputName: 'Searchlyst-Technical-White-Paper.pdf',
        cover: COVER_WHITE_PAPER,
        preProcess: (md) => fixDocLinks(stripMermaid(md)),
    });

    await buildOne({
        input: METHODOLOGY,
        outputName: 'Searchlyst-Scoring-Methodology.pdf',
        cover: COVER_METHODOLOGY,
        preProcess: fixDocLinks,
    });

    console.log('\nDone. PDFs: docs/pdf/output/ + public/docs/ (served at /docs/*.pdf).');
    console.log('Open in the app: http://localhost:5173/docs (or your dev URL + /docs)');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
