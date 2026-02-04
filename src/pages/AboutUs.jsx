import React from 'react';
import AboutHeroSection from '../components/about/AboutHeroSection';
import BornFromRevolutionSection from '../components/about/BornFromRevolutionSection';
import MigrationSection from '../components/about/MigrationSection';
import ProblemSection from '../components/about/ProblemSection';
import SolutionSection from '../components/about/SolutionSection';
import MoatSection from '../components/about/MoatSection';
import TractionSection from '../components/about/TractionSection';
import MarketOpportunitySection from '../components/about/MarketOpportunitySection';
import BusinessModelSection from '../components/about/BusinessModelSection';
import AboutFAQSection from '../components/about/AboutFAQSection';
import TeamSection from '../components/about/TeamSection';
import TheAskSection from '../components/about/TheAskSection';
import CTASection from '../components/about/CTASection';
import AboutFooter from '../components/about/AboutFooter';

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <AboutHeroSection />
            <BornFromRevolutionSection />
            <MigrationSection />
            <ProblemSection />
            <SolutionSection />
            <MoatSection />
            <TractionSection />
            <MarketOpportunitySection />
            <BusinessModelSection />
            <AboutFAQSection />
            <TeamSection />
            <TheAskSection />
            <CTASection />
            <AboutFooter />
        </div>
    );
}