import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExecutiveOverview from '@/components/dashboard/ExecutiveOverview';
import AIVisibilityPage from '@/components/dashboard/AIVisibilityPage';
import TechnicalHealthPage from '@/components/dashboard/TechnicalHealthPage';
import ContentOptimizationPage from '@/components/dashboard/ContentOptimizationPage';
import CompetitiveIntelPage from '@/components/dashboard/CompetitiveIntelPage';
import GeolocationPage from '@/components/dashboard/GeolocationPage';
import FAQHubPage from '@/components/dashboard/FAQHubPage.jsx';
import DomainSelector from '@/components/dashboard/DomainSelector';
import AddDomainModal from '@/components/dashboard/AddDomainModal';
import AIChatbot from '@/components/dashboard/AIChatbot';
import { base44 } from '@/api/base44Client';
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
    const [domains, setDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [showAddDomain, setShowAddDomain] = useState(false);

    useEffect(() => {
        loadDomains();
    }, []);

    const loadDomains = async () => {
        try {
            const data = await base44.entities.Domain.list();
            setDomains(data);
            if (data.length > 0 && !selectedDomain) {
                setSelectedDomain(data[0]);
            }
        } catch (error) {
            console.error('Failed to load domains:', error);
        }
    };

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
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-[var(--text-primary)]">AI Visibility Dashboard</h1>
                            <p className="text-xs text-[var(--text-secondary)]">Track your brand across AI platforms</p>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                            <DomainSelector 
                                domains={domains}
                                selectedDomain={selectedDomain}
                                onSelectDomain={setSelectedDomain}
                                onAddDomain={() => setShowAddDomain(true)}
                            />
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Live</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-[var(--bg-secondary)] border border-[var(--border)] p-1 mb-6 flex-wrap h-auto gap-1">
                        {tabs.map((tab) => (
                            <TabsTrigger 
                                key={tab.id}
                                value={tab.id}
                                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-[var(--text-secondary)] gap-2 text-sm px-3 py-2"
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="overview"><ExecutiveOverview selectedDomain={selectedDomain} /></TabsContent>
                    <TabsContent value="ai-visibility"><AIVisibilityPage /></TabsContent>
                    <TabsContent value="content"><ContentOptimizationPage /></TabsContent>
                    <TabsContent value="faq"><FAQHubPage /></TabsContent>
                    <TabsContent value="competitive"><CompetitiveIntelPage /></TabsContent>
                    <TabsContent value="geo"><GeolocationPage /></TabsContent>
                    <TabsContent value="technical"><TechnicalHealthPage /></TabsContent>
                </Tabs>
            </div>

            <AddDomainModal 
                open={showAddDomain} 
                onClose={() => setShowAddDomain(false)}
                onSuccess={loadDomains}
            />
            
            <AIChatbot />
        </div>
    );
}