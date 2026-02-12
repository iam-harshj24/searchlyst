import React, { useState, useEffect } from 'react';
import OverviewPage from '@/components/dashboard/OverviewPage';
import BrandHubPage from '@/components/dashboard/BrandHubPage';
import TopicDiscoveryPage from '@/components/dashboard/TopicDiscoveryPage';
import ContentStudioPage from '@/components/dashboard/ContentStudioPage';
import AIVisibilityPage from '@/components/dashboard/AIVisibilityPage';
import AuditHealthPage from '@/components/dashboard/AuditHealthPage';
import AgentPage from '@/components/dashboard/AgentPage';
import Sidebar from '@/components/dashboard/Sidebar';
import AddDomainModal from '@/components/dashboard/AddDomainModal';
import { base44 } from '@/api/base44Client';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [domains, setDomains] = useState([]);
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadDomains();
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await base44.auth.me();
        setUser(userData);
    };

    const loadDomains = async () => {
        const data = await base44.entities.Domain.list();
        setDomains(data);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewPage domains={domains} onAddDomain={() => setShowAddDomain(true)} onTabChange={setActiveTab} />;
            case 'brand-hub':
                return <BrandHubPage />;
            case 'topic-discovery':
                return <TopicDiscoveryPage onTabChange={setActiveTab} />;
            case 'content-studio':
                return <ContentStudioPage />;
            case 'ai-visibility':
                return <AIVisibilityPage />;
            case 'audit-health':
                return <AuditHealthPage />;
            case 'agent':
                return <AgentPage />;
            default:
                return <OverviewPage domains={domains} onAddDomain={() => setShowAddDomain(true)} onTabChange={setActiveTab} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-black">
            <Sidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                user={user}
            />
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