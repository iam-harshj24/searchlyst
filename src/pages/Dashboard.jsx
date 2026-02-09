import React, { useState, useEffect } from 'react';
import OverviewPage from '@/components/dashboard/OverviewPage';
import AgentPage from '@/components/dashboard/AgentPage';
import AIVisibilityPage from '@/components/dashboard/AIVisibilityPage';
import TechnicalHealthPage from '@/components/dashboard/TechnicalHealthPage';
import ContentOptimizationPage from '@/components/dashboard/ContentOptimizationPage';
import CompetitiveIntelPage from '@/components/dashboard/CompetitiveIntelPage';
import GeolocationPage from '@/components/dashboard/GeolocationPage';
import FAQHubPage from '@/components/dashboard/FAQHubPage.jsx';
import Sidebar from '@/components/dashboard/Sidebar';
import AddDomainModal from '@/components/dashboard/AddDomainModal';
import { base44 } from '@/api/base44Client';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [domains, setDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadDomains();
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await base44.auth.me();
            setUser(userData);
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    };

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

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewPage domains={domains} onAddDomain={() => setShowAddDomain(true)} />;
            case 'agent':
                return <AgentPage />;
            case 'ai-visibility':
            case 'mentions':
            case 'sources':
            case 'traffic':
                return <AIVisibilityPage />;
            case 'prompts':
            case 'research':
            case 'content':
                return <ContentOptimizationPage />;
            case 'technical':
                return <TechnicalHealthPage />;
            case 'faq':
                return <FAQHubPage />;
            default:
                return <OverviewPage domains={domains} onAddDomain={() => setShowAddDomain(true)} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)]">
            <Sidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                user={user}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>

            <AddDomainModal 
                open={showAddDomain} 
                onClose={() => setShowAddDomain(false)}
                onSuccess={loadDomains}
            />
        </div>
    );
}