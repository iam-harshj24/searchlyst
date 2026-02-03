import React from 'react';
import { ThemeProvider } from '@/components/landing/ThemeToggle';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import MarketGrowthSection from '@/components/landing/MarketGrowthSection';
import IndustryInsightSection from '@/components/landing/IndustryInsightSection';
import GrowthTrajectorySection from '@/components/landing/GrowthTrajectorySection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Navbar />
                <HeroSection />
                <MarketGrowthSection />
                <IndustryInsightSection />
                <GrowthTrajectorySection />
                <PricingSection />
                <FAQSection />
                <Footer />
            </div>
        </ThemeProvider>
    );
}