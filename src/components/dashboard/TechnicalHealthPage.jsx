import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Globe, Code, Database, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";

const crawlData = [
    { section: 'Product Pages', total: 245, indexed: 230, aiCrawled: 180, issues: 15 },
    { section: 'Blog Posts', total: 128, indexed: 125, aiCrawled: 120, issues: 3 },
    { section: 'Documentation', total: 89, indexed: 85, aiCrawled: 45, issues: 44 },
    { section: 'Support Articles', total: 156, indexed: 150, aiCrawled: 90, issues: 60 },
];

const schemaTypes = [
    { type: 'Organization', pages: 1, status: 'valid', color: '#10B981' },
    { type: 'Product', pages: 245, status: 'warnings', color: '#F59E0B' },
    { type: 'FAQ', pages: 89, status: 'valid', color: '#10B981' },
    { type: 'HowTo', pages: 34, status: 'errors', color: '#EF4444' },
    { type: 'Article', pages: 128, status: 'valid', color: '#10B981' },
];

const healthMetrics = [
    { label: 'Overall Crawl Health', value: 87, status: 'good' },
    { label: 'Schema Coverage', value: 72, status: 'warning' },
    { label: 'AI Discoverability', value: 65, status: 'warning' },
    { label: 'Entity Resolution', value: 91, status: 'good' },
];

export default function TechnicalHealthPage() {
    return (
        <div className="space-y-6">
            {/* Health Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {healthMetrics.map((metric, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">{metric.label}</span>
                            {metric.status === 'good' ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                            )}
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-white">{metric.value}%</span>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                                <div 
                                    className={`h-full rounded-full ${
                                        metric.status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${metric.value}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Crawl Coverage */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-400" />
                            Crawl Coverage
                        </h3>
                        <Button size="sm" variant="ghost" className="text-blue-400">View All</Button>
                    </div>
                    
                    <div className="space-y-4">
                        {crawlData.map((section, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white">{section.section}</span>
                                    <span className="text-gray-400">{section.total} pages</span>
                                </div>
                                <div className="flex gap-1 h-3">
                                    <div 
                                        className="bg-emerald-500 rounded-l"
                                        style={{ width: `${(section.indexed / section.total) * 100}%` }}
                                        title={`Google Indexed: ${section.indexed}`}
                                    />
                                    <div 
                                        className="bg-blue-500"
                                        style={{ width: `${((section.aiCrawled - section.issues) / section.total) * 100}%` }}
                                        title={`AI Crawled: ${section.aiCrawled}`}
                                    />
                                    {section.issues > 0 && (
                                        <div 
                                            className="bg-red-500 rounded-r"
                                            style={{ width: `${(section.issues / section.total) * 100}%` }}
                                            title={`Issues: ${section.issues}`}
                                        />
                                    )}
                                </div>
                                <div className="flex gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-emerald-500 rounded"></span>
                                        Indexed: {section.indexed}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-blue-500 rounded"></span>
                                        AI Crawled: {section.aiCrawled}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-red-500 rounded"></span>
                                        Issues: {section.issues}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Schema Implementation */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Code className="w-5 h-5 text-purple-400" />
                            Structured Data
                        </h3>
                        <Button size="sm" variant="ghost" className="text-purple-400">Audit</Button>
                    </div>

                    <div className="space-y-3">
                        {schemaTypes.map((schema, i) => (
                            <div 
                                key={i} 
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: schema.color }}
                                    />
                                    <span className="text-white text-sm">{schema.type}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-400 text-sm">{schema.pages} pages</span>
                                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                                        schema.status === 'valid' ? 'bg-emerald-500/20 text-emerald-400' :
                                        schema.status === 'warnings' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                        {schema.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-amber-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            34 pages missing FAQ schema
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            Adding FAQ schema could improve AI citation rate by ~25%
                        </p>
                    </div>
                </div>
            </div>

            {/* Entity Resolution */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Database className="w-5 h-5 text-cyan-400" />
                        Entity Resolution Flow
                    </h3>
                </div>

                <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
                    {[
                        { step: 1, label: 'URL Input', status: 'complete', detail: 'example.com/product-x' },
                        { step: 2, label: 'Entity Extraction', status: 'complete', detail: '"Product X" (92% confidence)' },
                        { step: 3, label: 'Attribute Mapping', status: 'warning', detail: '3 mismatches found' },
                        { step: 4, label: 'Knowledge Graph', status: 'complete', detail: 'Wikipedia, Crunchbase linked' },
                        { step: 5, label: 'Citation Ready', status: 'complete', detail: 'Score: 87/100' },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center min-w-[120px]">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                item.status === 'complete' ? 'bg-emerald-500/20 border-2 border-emerald-500' :
                                item.status === 'warning' ? 'bg-amber-500/20 border-2 border-amber-500' :
                                'bg-white/10 border-2 border-white/20'
                            }`}>
                                {item.status === 'complete' ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : item.status === 'warning' ? (
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                ) : (
                                    <span className="text-white">{item.step}</span>
                                )}
                            </div>
                            <span className="text-white text-sm mt-2">{item.label}</span>
                            <span className="text-gray-500 text-xs text-center mt-1">{item.detail}</span>
                            {i < 4 && (
                                <div className="absolute translate-x-[60px] w-8 h-0.5 bg-white/20 hidden lg:block" style={{ marginTop: '-36px' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}