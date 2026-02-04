import React, { useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/components/landing/ThemeToggle';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import Footer from '@/components/landing/Footer';
import CookieConsent from '@/components/CookieConsent';

// Lazy load sections for better performance
const MarketGrowthSection = lazy(() => import('@/components/landing/MarketGrowthSection'));
const IndustryInsightSection = lazy(() => import('@/components/landing/IndustryInsightSection'));
const GrowthTrajectorySection = lazy(() => import('@/components/landing/GrowthTrajectorySection'));
const PricingSection = lazy(() => import('@/components/landing/PricingSection'));
const FAQSection = lazy(() => import('@/components/landing/FAQSection'));

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
                <Suspense fallback={<div className="min-h-screen" />}>
                    <MarketGrowthSection />
                    <IndustryInsightSection />
                    <GrowthTrajectorySection />
                    <PricingSection />
                    <FAQSection />
                </Suspense>
                <Footer />
                <CookieConsent />
            </div>
        </ThemeProvider>
    );
}