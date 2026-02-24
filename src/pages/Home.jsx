import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/components/landing/ThemeToggle';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import Footer from '@/components/landing/Footer';
import CookieConsent from '@/components/CookieConsent';
import MarketGrowthSection from '@/components/landing/MarketGrowthSection';
import IndustryInsightSection from '@/components/landing/IndustryInsightSection';
import GrowthTrajectorySection from '@/components/landing/GrowthTrajectorySection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';

export default function Home() {
    const location = useLocation();

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash) {
            setTimeout(() => {
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, [location]);

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
                <CookieConsent />
            </div>
        </ThemeProvider>
    );
}