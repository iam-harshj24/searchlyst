import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExecutiveOverview from '@/components/dashboard/ExecutiveOverview';
import AIVisibilityPage from '@/components/dashboard/AIVisibilityPage';
import TechnicalHealthPage from '@/components/dashboard/TechnicalHealthPage';
import ContentOptimizationPage from '@/components/dashboard/ContentOptimizationPage';
import CompetitiveIntelPage from '@/components/dashboard/CompetitiveIntelPage';
import GeolocationPage from '@/components/dashboard/GeolocationPage';
import FAQHubPage from '@/components/dashboard/FAQHubPage';
import { 
    LayoutDashboard, 
    Brain, 
    Settings2, 
    FileText, 
    Swords, 
    Globe2, 
    HelpCircle,
    Bell,
    Download,
    Search
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'ai-visibility', label: 'AI Visibility', icon: Brain },
        { id: 'technical', label: 'Technical Health', icon: Settings2 },
        { id: 'content', label: 'Content', icon: FileText },
        { id: 'competitive', label: 'Competitive Intel', icon: Swords },
        { id: 'geo', label: 'Geolocation', icon: Globe2 },
        { id: 'faq', label: 'FAQ Hub', icon: HelpCircle },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            {/* Top Header */}
            <header className="border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-white">AI Visibility Dashboard</h1>
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Live</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input 
                                placeholder="Search metrics..." 
                                className="w-64 bg-white/5 border-white/10 text-white pl-10 h-9"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <Bell className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <Download className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto px-6 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 flex-wrap h-auto">
                        {tabs.map((tab) => (
                            <TabsTrigger 
                                key={tab.id}
                                value={tab.id}
                                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 gap-2"
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="overview" className="mt-0">
                        <ExecutiveOverview />
                    </TabsContent>
                    <TabsContent value="ai-visibility" className="mt-0">
                        <AIVisibilityPage />
                    </TabsContent>
                    <TabsContent value="technical" className="mt-0">
                        <TechnicalHealthPage />
                    </TabsContent>
                    <TabsContent value="content" className="mt-0">
                        <ContentOptimizationPage />
                    </TabsContent>
                    <TabsContent value="competitive" className="mt-0">
                        <CompetitiveIntelPage />
                    </TabsContent>
                    <TabsContent value="geo" className="mt-0">
                        <GeolocationPage />
                    </TabsContent>
                    <TabsContent value="faq" className="mt-0">
                        <FAQHubPage />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}