import React, { useState, useEffect } from 'react';
import {
    FileSearch, Activity, AlertTriangle, XCircle,
    Search, Loader2, Zap, MapPin, Bot, Sparkles, Download, ChevronDown,
    GitCompare, CheckCircle, PlusCircle
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import EmptyProjectState from '@/components/dashboard/EmptyProjectState';

const AUDIT_CATEGORIES = [
    { id: 'seo', name: 'SEO Audit', icon: Search, color: 'text-white', bgColor: 'from-white/[0.04] to-white/[0.02]', borderColor: 'border-white/10', description: 'Search engine optimization' },
    { id: 'aeo', name: 'AEO Audit', icon: Bot, color: 'text-red-400', bgColor: 'from-red-500/10 to-red-600/10', borderColor: 'border-red-500/20', description: 'AI engine optimization' },
    { id: 'geo', name: 'GEO Audit', icon: MapPin, color: 'text-white/60', bgColor: 'from-white/[0.04] to-white/[0.02]', borderColor: 'border-white/10', description: 'Geolocation optimization' },
];

const AI_CATEGORY = { id: 'ai', name: 'AI Visibility', icon: Sparkles, color: 'text-amber-400', bgColor: 'from-amber-500/10 to-amber-600/10', borderColor: 'border-amber-500/20', description: 'AI citation visibility' };

export default function AuditHealthPage({ activeProject, onAddProject }) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [auditUrl, setAuditUrl] = useState('');
    const [auditMode, setAuditMode] = useState('single');
    const [running, setRunning] = useState(false);
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [compareAudit1, setCompareAudit1] = useState('');
    const [compareAudit2, setCompareAudit2] = useState('');
    const [comparison, setComparison] = useState(null);
    const [comparing, setComparing] = useState(false);

    const latestAudit = audits.find((a) => a.status === 'completed') ?? audits[0];
    const completedAudits = audits.filter((a) => a.status === 'completed');

    useEffect(() => {
        if (activeProject?.url) {
            setAuditUrl(activeProject.url);
        }
    }, [activeProject?.url]);

    useEffect(() => {
        if (activeProject?.id) {
            loadAudits();
        } else {
            setLoading(false);
        }
    }, [activeProject?.id]);

    const loadAudits = async () => {
        if (!activeProject?.id) return;
        setLoading(true);
        setError(null);
        try {
            const list = await apiClient.audit.list(activeProject.id);
            setAudits(list);
        } catch (err) {
            console.error('Load audits:', err);
            setError(err.message || 'Failed to load audits');
            toast.error('Failed to load audits');
        } finally {
            setLoading(false);
        }
    };

    const handleRunAudit = async () => {
        if (!activeProject?.id) {
            toast.error('Please select or create a project first');
            return;
        }
        const urlToUse = auditUrl?.trim() || activeProject?.url;
        if (!urlToUse) {
            toast.error('Enter a website URL to audit');
            return;
        }
        setRunning(true);
        setError(null);
        try {
            const audit = await apiClient.audit.run(activeProject.id, {
                url: urlToUse,
                mode: auditMode,
                includeAiCheck: true,
            });
            setAudits((prev) => [audit, ...prev]);
            toast.success('Audit completed');
        } catch (err) {
            console.error('Run audit:', err);
            setError(err.message || 'Audit failed');
            toast.error(err.message || 'Audit failed');
        } finally {
            setRunning(false);
        }
    };

    const handleCompare = async () => {
        if (!activeProject?.id || !compareAudit1 || !compareAudit2 || compareAudit1 === compareAudit2) {
            toast.error('Select two different audits to compare');
            return;
        }
        setComparing(true);
        setComparison(null);
        try {
            const data = await apiClient.audit.compare(activeProject.id, compareAudit1, compareAudit2);
            setComparison(data);
        } catch (err) {
            toast.error(err.message || 'Failed to compare audits');
        } finally {
            setComparing(false);
        }
    };

    const handleExport = async (format) => {
        if (!activeProject?.id || !latestAudit?.id) return;
        setExporting(true);
        try {
            await apiClient.audit.export(activeProject.id, latestAudit.id, format);
            toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (err) {
            toast.error(err.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'high': return 'bg-red-500/5 border-red-500/20 text-red-300';
            case 'medium': return 'bg-white/[0.06] border-white/10 text-white/60';
            case 'low': return 'bg-white/[0.03] border-white/[0.06] text-white/40';
            default: return 'bg-white/[0.03] border-white/[0.06] text-white/40';
        }
    };

    const getCategoryData = (catId) => {
        if (!latestAudit) return { score: null, issues: 0 };
        if (catId === 'ai') {
            return { score: latestAudit.ai_citation_score ?? null, issues: 0 };
        }
        const score = catId === 'seo' ? latestAudit.seo_score : catId === 'aeo' ? latestAudit.aeo_score : latestAudit.geo_score;
        const issues = catId === 'seo' ? latestAudit.seo_issues_count : catId === 'aeo' ? latestAudit.aeo_issues_count : latestAudit.geo_issues_count;
        return { score: score ?? 0, issues: issues ?? 0 };
    };

    const allCategories = latestAudit?.ai_citation_score != null
        ? [...AUDIT_CATEGORIES, AI_CATEGORY]
        : AUDIT_CATEGORIES;

    const filteredIssues = latestAudit?.issues
        ? (selectedCategory === 'all'
            ? latestAudit.issues
            : selectedCategory === 'ai'
                ? []
                : latestAudit.issues.filter((i) => i.category === selectedCategory))
        : [];

    if (!activeProject) {
        return <EmptyProjectState onAddProject={onAddProject} />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-red-400" />
                    Audits & Health
                </h1>
                <p className="text-white/40 text-sm mt-1">SEO, AEO, and GEO health checks for your website.</p>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5">
                <h3 className="text-white font-medium text-sm mb-3">Run a New Audit</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                        value={auditUrl}
                        onChange={(e) => setAuditUrl(e.target.value)}
                        placeholder="Enter your website URL (e.g. https://yourwebsite.com)"
                        className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl flex-1"
                    />
                    <div className="flex gap-2">
                        <select
                            value={auditMode}
                            onChange={(e) => setAuditMode(e.target.value)}
                            className="bg-[#0a0a0a] border border-white/20 text-white rounded-xl px-3 py-2 text-sm"
                        >
                            <option value="single" className="bg-[#0a0a0a] text-white">Quick (homepage)</option>
                            <option value="full" className="bg-[#0a0a0a] text-white">Full site</option>
                        </select>
                        <Button
                            onClick={handleRunAudit}
                            disabled={running || !(auditUrl?.trim() || activeProject?.url)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6"
                        >
                            {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                            {running ? 'Scanning...' : 'Run Audit'}
                        </Button>
                    </div>
                </div>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>

            {!latestAudit ? (
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-12 text-center">
                    <FileSearch className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 text-sm">No audit yet. Run your first audit above.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium text-sm">Scores</h3>
                        {latestAudit && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={exporting}
                                        className="!bg-[#1a1a1a] border-white/20 !text-white hover:!bg-white/10"
                                    >
                                        {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                        Export
                                        <ChevronDown className="w-4 h-4 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/20 text-white">
                                    <DropdownMenuItem onClick={() => handleExport('pdf')} className="text-white focus:bg-white/10 focus:text-white">
                                        Export as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('csv')} className="text-white focus:bg-white/10 focus:text-white">
                                        Export as CSV
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <div className={`grid grid-cols-1 gap-4 ${allCategories.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
                        {allCategories.map((cat) => {
                            const { score, issues } = getCategoryData(cat.id);
                            const displayScore = score ?? 0;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                                    className={`bg-gradient-to-br ${cat.bgColor} border ${cat.borderColor} rounded-2xl p-5 text-left transition-all ${
                                        selectedCategory === cat.id ? 'ring-1 ring-red-500/30' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <cat.icon className={`w-5 h-5 ${cat.color}`} />
                                        <span className="text-white/30 text-xs">{cat.description}</span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-white font-medium text-sm">{cat.name}</p>
                                            <p className="text-3xl font-bold text-white mt-1">
                                                {displayScore}<span className="text-white/30 text-lg">/100</span>
                                            </p>
                                        </div>
                                        {cat.id !== 'ai' && (
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                                                    issues > 8 ? 'bg-red-500/10 text-red-400' :
                                                    issues > 4 ? 'bg-white/10 text-white/60' :
                                                    'bg-white/10 text-white'
                                                }`}>
                                                    {issues} issues
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${
                                            displayScore >= 80 ? 'bg-white' :
                                            displayScore >= 60 ? 'bg-white/60' : 'bg-red-500'
                                        }`} style={{ width: `${displayScore}%` }} />
                                    </div>
                                    {latestAudit.pages_crawled > 1 && cat.id === 'seo' && (
                                        <p className="text-white/30 text-[10px] mt-2">{latestAudit.pages_crawled} pages analyzed</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {completedAudits.length >= 2 && (
                        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                            <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                                <GitCompare className="w-4 h-4 text-red-400" />
                                Compare Audits
                            </h3>
                            <div className="flex flex-wrap gap-3 items-end">
                                <div>
                                    <label className="text-white/40 text-xs block mb-1">Older audit</label>
                                    <select
                                        value={compareAudit1}
                                        onChange={(e) => { setCompareAudit1(e.target.value); setComparison(null); }}
                                        className="bg-[#0a0a0a] border border-white/20 text-white rounded-xl px-3 py-2 text-sm min-w-[180px]"
                                    >
                                        <option value="" className="bg-[#0a0a0a] text-white">Select...</option>
                                        {completedAudits.map((a) => (
                                            <option key={a.id} value={a.id} className="bg-[#0a0a0a] text-white">
                                                {new Date(a.completed_at || a.created_at).toLocaleDateString()} – SEO {a.seo_score ?? '-'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-white/40 text-xs block mb-1">Newer audit</label>
                                    <select
                                        value={compareAudit2}
                                        onChange={(e) => { setCompareAudit2(e.target.value); setComparison(null); }}
                                        className="bg-[#0a0a0a] border border-white/20 text-white rounded-xl px-3 py-2 text-sm min-w-[180px]"
                                    >
                                        <option value="" className="bg-[#0a0a0a] text-white">Select...</option>
                                        {completedAudits.map((a) => (
                                            <option key={a.id} value={a.id} className="bg-[#0a0a0a] text-white">
                                                {new Date(a.completed_at || a.created_at).toLocaleDateString()} – SEO {a.seo_score ?? '-'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    onClick={handleCompare}
                                    disabled={comparing || !compareAudit1 || !compareAudit2 || compareAudit1 === compareAudit2}
                                    className="!bg-[#1a1a1a] border border-white/20 !text-white hover:!bg-white/10"
                                >
                                    {comparing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitCompare className="w-4 h-4 mr-2" />}
                                    Compare
                                </Button>
                            </div>
                            {comparison && (
                                <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {['seo', 'aeo', 'geo', 'ai'].map((key) => {
                                            const s = comparison.scores[key];
                                            if (!s || (s.from == null && s.to == null)) return null;
                                            const delta = s.delta;
                                            const isUp = delta != null && delta > 0;
                                            const isDown = delta != null && delta < 0;
                                            return (
                                                <div key={key} className="bg-white/[0.02] rounded-xl p-3">
                                                    <p className="text-white/40 text-[10px] uppercase">{key}</p>
                                                    <p className="text-white font-medium">
                                                        {s.from ?? '-'} → {s.to ?? '-'}
                                                        {delta != null && (
                                                            <span className={`ml-1 text-xs ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-white/60'}`}>
                                                                ({isUp ? '+' : ''}{delta})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                                            <p className="text-green-400 text-sm font-medium flex items-center gap-2 mb-2">
                                                <CheckCircle className="w-4 h-4" /> Resolved ({comparison.issues.resolved.length})
                                            </p>
                                            <p className="text-white/50 text-xs">Issues fixed since last audit</p>
                                            {comparison.issues.resolved.length > 0 ? (
                                                <ul className="mt-2 space-y-1 text-white/70 text-xs">
                                                    {comparison.issues.resolved.slice(0, 5).map((i, idx) => (
                                                        <li key={idx}>• {i.title}</li>
                                                    ))}
                                                    {comparison.issues.resolved.length > 5 && (
                                                        <li className="text-white/40">+{comparison.issues.resolved.length - 5} more</li>
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="text-white/40 text-xs mt-1">None</p>
                                            )}
                                        </div>
                                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                            <p className="text-amber-400 text-sm font-medium flex items-center gap-2 mb-2">
                                                <PlusCircle className="w-4 h-4" /> New ({comparison.issues.added.length})
                                            </p>
                                            <p className="text-white/50 text-xs">Issues introduced since last audit</p>
                                            {comparison.issues.added.length > 0 ? (
                                                <ul className="mt-2 space-y-1 text-white/70 text-xs">
                                                    {comparison.issues.added.slice(0, 5).map((i, idx) => (
                                                        <li key={idx}>• {i.title}</li>
                                                    ))}
                                                    {comparison.issues.added.length > 5 && (
                                                        <li className="text-white/40">+{comparison.issues.added.length - 5} more</li>
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="text-white/40 text-xs mt-1">None</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-medium text-sm">
                                {selectedCategory === 'all' ? 'All Issues' : selectedCategory === 'ai' ? 'AI Visibility' : allCategories.find((c) => c.id === selectedCategory)?.name + ' Issues'}
                            </h3>
                            <span className="text-white/30 text-xs">{filteredIssues.length} issues found</span>
                        </div>
                        <div className="space-y-3">
                            {selectedCategory === 'ai' ? (
                                <p className="text-white/40 text-sm py-4">
                                    AI Visibility score indicates how often your site is cited by AI search engines like Perplexity. Improve with strong schema markup and authoritative content.
                                </p>
                            ) : filteredIssues.length === 0 ? (
                                <p className="text-white/40 text-sm py-4">No issues in this category.</p>
                            ) : (
                                filteredIssues.map((issue) => (
                                    <div key={issue.id} className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-3">
                                                {issue.severity === 'critical' ? <XCircle className="w-4 h-4 text-red-400 mt-0.5" /> :
                                                 issue.severity === 'high' ? <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5" /> :
                                                 issue.severity === 'medium' ? <AlertTriangle className="w-4 h-4 text-white/60 mt-0.5" /> :
                                                 <Activity className="w-4 h-4 text-white/40 mt-0.5" />}
                                                <div>
                                                    <p className="text-white text-sm font-medium">{issue.title}</p>
                                                    <p className="text-white/30 text-xs mt-0.5">{issue.impact}</p>
                                                    {issue.meta?.pages?.length > 1 && (
                                                        <p className="text-white/20 text-[10px] mt-1">{issue.meta.pages.length} pages affected</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border capitalize ${getSeverityStyle(issue.severity)}`}>
                                                {issue.severity}
                                            </span>
                                        </div>
                                        <div className="ml-7 mt-2 flex items-center gap-2">
                                            <span className="text-red-400 text-xs">Fix:</span>
                                            <span className="text-white/40 text-xs">{issue.fix}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
