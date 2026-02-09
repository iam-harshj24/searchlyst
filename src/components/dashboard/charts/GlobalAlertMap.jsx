import React from 'react';
import { AlertTriangle, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";

const alerts = [
    { severity: 'High', engine: 'ChatGPT', location: 'Germany', time: '2hr ago', issue: 'Hallucination about pricing - showing outdated $199 instead of $149' },
    { severity: 'High', engine: 'Gemini', location: 'USA', time: '4hr ago', issue: 'Competitor cited as market leader in enterprise segment' },
    { severity: 'Medium', engine: 'Perplexity', location: 'UK', time: '6hr ago', issue: 'Missing from "top 10 CRM" comparison list' },
    { severity: 'Medium', engine: 'Claude', location: 'Canada', time: '8hr ago', issue: 'Sentiment drift detected - negative mentions increasing' },
    { severity: 'Low', engine: 'ChatGPT', location: 'Australia', time: '12hr ago', issue: 'Feature description outdated - missing Q4 updates' },
];

const regions = [
    { name: 'North America', citations: 12500, sentiment: 0.75, x: '20%', y: '35%' },
    { name: 'Europe', citations: 8200, sentiment: 0.62, x: '48%', y: '30%' },
    { name: 'Asia Pacific', citations: 5800, sentiment: 0.68, x: '75%', y: '45%' },
    { name: 'Latin America', citations: 2100, sentiment: 0.71, x: '28%', y: '65%' },
    { name: 'Middle East', citations: 1200, sentiment: 0.58, x: '55%', y: '45%' },
];

const getSeverityColor = (severity) => {
    switch(severity) {
        case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'Medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        case 'Low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

export default function GlobalAlertMap() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Visualization */}
            <div className="lg:col-span-2 relative bg-[#0d0d15] rounded-xl h-80 overflow-hidden">
                {/* Simplified World Map Background */}
                <div className="absolute inset-0 opacity-30">
                    <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                        {/* Simplified continent shapes */}
                        <path d="M15,20 Q25,15 35,22 L32,35 Q20,38 15,30 Z" fill="#3B82F6" opacity="0.3" />
                        <path d="M40,18 Q55,12 58,25 L52,35 Q42,32 40,25 Z" fill="#3B82F6" opacity="0.3" />
                        <path d="M60,20 Q75,15 85,30 L80,42 Q65,45 60,35 Z" fill="#3B82F6" opacity="0.3" />
                        <path d="M20,40 Q30,42 28,48 L22,48 Z" fill="#3B82F6" opacity="0.3" />
                    </svg>
                </div>

                {/* Citation Dots */}
                {regions.map((region, i) => (
                    <div 
                        key={i}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                        style={{ left: region.x, top: region.y }}
                    >
                        <div 
                            className="rounded-full bg-blue-500 animate-pulse"
                            style={{ 
                                width: Math.max(12, region.citations / 1000) + 'px',
                                height: Math.max(12, region.citations / 1000) + 'px',
                                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                            }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-2 shadow-xl whitespace-nowrap">
                                <p className="text-white text-sm font-medium">{region.name}</p>
                                <p className="text-blue-400 text-xs">{region.citations.toLocaleString()} citations</p>
                                <p className={`text-xs ${region.sentiment >= 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    Sentiment: {region.sentiment}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-black/50 rounded-lg p-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Citation density</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Active threats</span>
                    </div>
                </div>
            </div>

            {/* Alerts Panel */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                <h4 className="text-white font-medium text-sm sticky top-0 bg-white/5 backdrop-blur py-2">
                    Critical Issues ({alerts.length})
                </h4>
                {alerts.map((alert, i) => (
                    <div 
                        key={i} 
                        className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} text-sm`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                alert.severity === 'High' ? 'bg-red-500/30' :
                                alert.severity === 'Medium' ? 'bg-amber-500/30' : 'bg-blue-500/30'
                            }`}>
                                {alert.severity}
                            </span>
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {alert.time}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                            <span>{alert.engine}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {alert.location}
                            </span>
                        </div>
                        <p className="text-gray-300 text-xs mb-2">{alert.issue}</p>
                        <Button size="sm" variant="ghost" className="h-6 text-xs text-blue-400 hover:text-blue-300 p-0">
                            Investigate <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}