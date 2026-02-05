import React from 'react';
import { ThemeProvider } from '@/components/landing/ThemeToggle';
import Navbar from '@/components/landing/Navbar';
import AboutHeroSection from '../components/about/AboutHeroSection';
import AboutFooter from '../components/about/AboutFooter';
import CookieConsent from '@/components/CookieConsent';
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

export default function AboutUs() {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Navbar />
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
                <CookieConsent />
            </div>
        </ThemeProvider>
    );
}