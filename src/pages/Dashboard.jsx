import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExecutiveOverview from '@/components/dashboard/ExecutiveOverview';
import AIVisibilityPage from '@/components/dashboard/AIVisibilityPage';
import TechnicalHealthPage from '@/components/dashboard/TechnicalHealthPage';
import ContentOptimizationPage from '@/components/dashboard/ContentOptimizationPage';
import CompetitiveIntelPage from '@/components/dashboard/CompetitiveIntelPage';
import GeolocationPage from '@/components/dashboard/GeolocationPage';
import FAQHubPage from '@/components/dashboard/FAQHubPage.jsx';
import { 
    LayoutDashboard, 
    Brain, 
    Settings2, 
    FileText, 
    Swords, 
    Globe2, 
    HelpCircle
} from 'lucide-react';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'ai-visibility', label: 'AI Visibility', icon: Brain },
        { id: 'content', label: 'Content', icon: FileText },
        { id: 'faq', label: 'FAQ Hub', icon: HelpCircle },
        { id: 'competitive', label: 'Competitors', icon: Swords },
        { id: 'geo', label: 'Regions', icon: Globe2 },
        { id: 'technical', label: 'Technical', icon: Settings2 },
    ];

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <header className="border-b border-white/10 bg-gray-950/95 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">AI Visibility Dashboard</h1>
                            <p className="text-xs text-gray-500">Track your brand across AI platforms</p>
                        </div>
                        <span className="ml-auto px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Live</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 flex-wrap h-auto gap-1">
                        {tabs.map((tab) => (
                            <TabsTrigger 
                                key={tab.id}
                                value={tab.id}
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 gap-2 text-sm px-3 py-2"
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="overview"><ExecutiveOverview /></TabsContent>
                    <TabsContent value="ai-visibility"><AIVisibilityPage /></TabsContent>
                    <TabsContent value="content"><ContentOptimizationPage /></TabsContent>
                    <TabsContent value="faq"><FAQHubPage /></TabsContent>
                    <TabsContent value="competitive"><CompetitiveIntelPage /></TabsContent>
                    <TabsContent value="geo"><GeolocationPage /></TabsContent>
                    <TabsContent value="technical"><TechnicalHealthPage /></TabsContent>
                </Tabs>
            </div>
        </div>
    );
}