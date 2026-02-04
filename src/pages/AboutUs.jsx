import React, { lazy, Suspense } from 'react';
import { ThemeProvider } from '@/components/landing/ThemeToggle';
import Navbar from '@/components/landing/Navbar';
import AboutHeroSection from '../components/about/AboutHeroSection';
import AboutFooter from '../components/about/AboutFooter';
import CookieConsent from '@/components/CookieConsent';

// Lazy load sections for better performance
const BornFromRevolutionSection = lazy(() => import('../components/about/BornFromRevolutionSection'));
const MigrationSection = lazy(() => import('../components/about/MigrationSection'));
const ProblemSection = lazy(() => import('../components/about/ProblemSection'));
const SolutionSection = lazy(() => import('../components/about/SolutionSection'));
const MoatSection = lazy(() => import('../components/about/MoatSection'));
const TractionSection = lazy(() => import('../components/about/TractionSection'));
const MarketOpportunitySection = lazy(() => import('../components/about/MarketOpportunitySection'));
const BusinessModelSection = lazy(() => import('../components/about/BusinessModelSection'));
const AboutFAQSection = lazy(() => import('../components/about/AboutFAQSection'));
const TeamSection = lazy(() => import('../components/about/TeamSection'));
const TheAskSection = lazy(() => import('../components/about/TheAskSection'));
const CTASection = lazy(() => import('../components/about/CTASection'));

export default function AboutUs() {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Navbar />
                <AboutHeroSection />
                <Suspense fallback={<div className="min-h-screen" />}>
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
                </Suspense>
                <AboutFooter />
                <CookieConsent />
            </div>
        </ThemeProvider>
    );
}