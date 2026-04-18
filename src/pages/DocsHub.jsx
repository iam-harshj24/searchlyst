import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, ArrowLeft, BookOpen } from 'lucide-react';

function docPdfUrl(filename) {
    const base = import.meta.env.BASE_URL || '/';
    const root = base.endsWith('/') ? base : `${base}/`;
    return `${root}docs/${filename}`;
}

const DOCS = [
    {
        file: 'Searchlyst-Technical-White-Paper.pdf',
        title: 'Technical white paper',
        desc: 'End-to-end stack, data pipeline, scraping, parsing, and scoring architecture.',
    },
    {
        file: 'Searchlyst-Scoring-Methodology.pdf',
        title: 'Scoring & sentiment methodology',
        desc: 'Formulas, weights, AI Presence Index, SOV sentiment, and UI KPI alignment.',
    },
];

export default function DocsHub() {
    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(233,42,21,0.12),transparent)] pointer-events-none" />
            <div className="relative max-w-2xl mx-auto px-6 py-16">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-[#888] hover:text-white text-sm mb-10 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </Link>

                <div className="flex items-start gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#E92A15]/15 border border-[#E92A15]/35 flex items-center justify-center shrink-0">
                        <BookOpen className="w-7 h-7 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
                        <p className="text-[#888] text-sm mt-1 leading-relaxed">
                            Download PDFs for methodology, scoring, and system architecture. Regenerate locally with{' '}
                            <code className="text-[#ccc] bg-[#1a1a1a] px-1.5 py-0.5 rounded text-xs">npm run docs:pdf</code>
                            .
                        </p>
                    </div>
                </div>

                <ul className="space-y-4">
                    {DOCS.map((d) => (
                        <li key={d.file}>
                            <a
                                href={docPdfUrl(d.file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-start gap-4 p-5 rounded-2xl bg-[#0d0d0d] border border-[#222] hover:border-[#E92A15]/40 hover:bg-[#111] transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0 group-hover:border-[#E92A15]/30">
                                    <FileText className="w-5 h-5 text-[#888] group-hover:text-[#E92A15]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-white">{d.title}</span>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#E92A15]">
                                            <Download className="w-3 h-3" />
                                            PDF
                                        </span>
                                    </div>
                                    <p className="text-[#777] text-sm mt-1">{d.desc}</p>
                                    <p className="text-[#555] text-xs mt-2 font-mono truncate">{d.file}</p>
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>

                <p className="text-[#555] text-xs mt-10 leading-relaxed">
                    If a link opens a blank page, run <code className="text-[#666]">npm run docs:pdf</code> from the project root to
                    build PDFs into <code className="text-[#666]">public/docs/</code>.
                </p>
            </div>
        </div>
    );
}
