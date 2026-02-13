import React, { useState } from 'react';
import { 
    FileSearch, Globe, Activity, AlertTriangle, CheckCircle, XCircle,
    Search, ArrowRight, Loader2, Shield, Zap, Eye, BarChart3,
    MapPin, Bot, ChevronRight
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

const auditCategories = [
    { 
        id: 'seo', 
        name: 'SEO Audit', 
        icon: Search, 
        color: 'text-white', 
        bgColor: 'from-white/[0.04] to-white/[0.02]',
        borderColor: 'border-white/10',
        score: 82,
        issues: 7,
        description: 'Search engine optimization'
    },
    { 
        id: 'aeo', 
        name: 'AEO Audit', 
        icon: Bot, 
        color: 'text-red-400', 
        bgColor: 'from-red-500/10 to-red-600/10',
        borderColor: 'border-red-500/20',
        score: 68,
        issues: 12,
        description: 'AI engine optimization'
    },
    { 
        id: 'geo', 
        name: 'GEO Audit', 
        icon: MapPin, 
        color: 'text-white/60', 
        bgColor: 'from-white/[0.04] to-white/[0.02]',
        borderColor: 'border-white/10',
        score: 74,
        issues: 5,
        description: 'Geolocation optimization'
    },
];

const issuesList = [
    { category: 'aeo', severity: 'critical', title: 'No FAQ schema markup found', impact: 'AI search engines cannot extract Q&A content', fix: 'Add FAQ structured data to key pages' },
    { category: 'aeo', severity: 'high', title: 'Content not optimized for conversational queries', impact: 'AI assistants skip your content for direct answers', fix: 'Restructure content with question-answer format' },
    { category: 'seo', severity: 'high', title: '23 pages missing meta descriptions', impact: 'Reduced click-through and AI summarization accuracy', fix: 'Add unique meta descriptions to all pages' },
    { category: 'aeo', severity: 'medium', title: 'Entity markup incomplete', impact: 'AI models may misidentify your brand/products', fix: 'Add Organization and Product schema' },
    { category: 'geo', severity: 'medium', title: 'No hreflang tags for multi-region content', impact: 'Wrong regional content shown to users', fix: 'Implement hreflang tags' },
    { category: 'seo', severity: 'medium', title: 'Core Web Vitals: LCP needs improvement', impact: 'Slower page loads, reduced AI crawl priority', fix: 'Optimize images and reduce server response' },
    { category: 'geo', severity: 'low', title: 'Local business schema missing', impact: 'Reduced local AI search visibility', fix: 'Add LocalBusiness schema markup' },
    { category: 'seo', severity: 'low', title: '5 broken internal links', impact: 'Impaired crawlability', fix: 'Fix or redirect broken links' },
];

export default function AuditHealthPage() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [auditUrl, setAuditUrl] = useState('');
    const [running, setRunning] = useState(false);

    const filteredIssues = selectedCategory === 'all' 
        ? issuesList 
        : issuesList.filter(i => i.category === selectedCategory);

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'high': return 'bg-red-500/5 border-red-500/20 text-red-300';
            case 'medium': return 'bg-white/[0.06] border-white/10 text-white/60';
            case 'low': return 'bg-white/[0.03] border-white/[0.06] text-white/40';
            default: return 'bg-white/[0.03] border-white/[0.06] text-white/40';
        }
    };

    const handleRunAudit = async () => {
        if (!auditUrl.trim()) return;
        setRunning(true);
        // Simulate audit
        await new Promise(r => setTimeout(r, 3000));
        setRunning(false);
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-red-400" />
                    Audits & Health
                </h1>
                <p className="text-white/40 text-sm mt-1">SEO, AEO, and GEO health checks for your website.</p>
            </div>

            {/* Run New Audit */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5">
                <h3 className="text-white font-medium text-sm mb-3">Run a New Audit</h3>
                <div className="flex gap-3">
                    <Input
                        value={auditUrl}
                        onChange={(e) => setAuditUrl(e.target.value)}
                        placeholder="Enter your website URL (e.g. https://yourwebsite.com)"
                        className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl flex-1"
                    />
                    <Button 
                        onClick={handleRunAudit}
                        disabled={running || !auditUrl.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6"
                    >
                        {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                        {running ? 'Scanning...' : 'Run Audit'}
                    </Button>
                </div>
            </div>

            {/* Audit Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {auditCategories.map((cat) => (
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
                                <p className="text-3xl font-bold text-white mt-1">{cat.score}<span className="text-white/30 text-lg">/100</span></p>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                                    cat.issues > 8 ? 'bg-red-500/10 text-red-400' :
                                    cat.issues > 4 ? 'bg-white/10 text-white/60' :
                                    'bg-white/10 text-white'
                                }`}>
                                    {cat.issues} issues
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                            cat.score >= 80 ? 'bg-white' :
                            cat.score >= 60 ? 'bg-white/60' : 'bg-red-500'
                        }`} style={{ width: `${cat.score}%` }} />
                        </div>
                    </button>
                ))}
            </div>

            {/* Issues List */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium text-sm">
                        {selectedCategory === 'all' ? 'All Issues' : `${auditCategories.find(c => c.id === selectedCategory)?.name} Issues`}
                    </h3>
                    <span className="text-white/30 text-xs">{filteredIssues.length} issues found</span>
                </div>
                <div className="space-y-3">
                    {filteredIssues.map((issue, i) => (
                        <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-3">
                                    {issue.severity === 'critical' ? <XCircle className="w-4 h-4 text-red-400 mt-0.5" /> :
                                     issue.severity === 'high' ? <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5" /> :
                                     issue.severity === 'medium' ? <AlertTriangle className="w-4 h-4 text-white/60 mt-0.5" /> :
                                     <Activity className="w-4 h-4 text-white/40 mt-0.5" />}
                                    <div>
                                        <p className="text-white text-sm font-medium">{issue.title}</p>
                                        <p className="text-white/30 text-xs mt-0.5">{issue.impact}</p>
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
                    ))}
                </div>
            </div>
        </div>
    );
}