import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, Cookie, Shield, Settings } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState({
        necessary: true,
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setShowBanner(true);
        } else {
            const saved = JSON.parse(consent);
            setPreferences(saved);
            applyCookiePreferences(saved);
        }
    }, []);

    const applyCookiePreferences = (prefs) => {
        // Block/remove cookies based on preferences
        if (!prefs.analytics) {
            // Remove analytics cookies (including "Cassie" if it's analytics-related)
            document.cookie.split(";").forEach((c) => {
                const cookie = c.trim();
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                if (name.includes('_ga') || name.includes('_gid') || name.toLowerCase().includes('cassie')) {
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            });
        }
        if (!prefs.marketing) {
            // Remove marketing cookies
            document.cookie.split(";").forEach((c) => {
                const cookie = c.trim();
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                if (name.includes('_fbp') || name.includes('_gcl')) {
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            });
        }
    };

    const handleAcceptAll = () => {
        const allAccepted = { necessary: true, analytics: true, marketing: true };
        setPreferences(allAccepted);
        localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
        applyCookiePreferences(allAccepted);
        setShowBanner(false);
    };

    const handleRejectAll = () => {
        const rejected = { necessary: true, analytics: false, marketing: false };
        setPreferences(rejected);
        localStorage.setItem('cookieConsent', JSON.stringify(rejected));
        applyCookiePreferences(rejected);
        setShowBanner(false);
    };

    const handleSavePreferences = () => {
        localStorage.setItem('cookieConsent', JSON.stringify(preferences));
        applyCookiePreferences(preferences);
        setShowSettings(false);
        setShowBanner(false);
    };

    return (
        <>
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-4 left-4 right-4 lg:bottom-6 lg:left-6 lg:right-6 z-50"
                    >
                        {/* Mobile & Tablet: Compact popup */}
                        <div className="lg:hidden bg-[#0a0a0a] bg-opacity-95 backdrop-blur-sm border border-[var(--border)] rounded-xl p-4 shadow-2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <Cookie className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-[var(--text-primary)] text-sm font-medium">We use cookies</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setShowSettings(true)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs h-8"
                                >
                                    <Settings className="w-3 h-3 mr-1" />
                                    Customize
                                </Button>
                                <Button
                                    onClick={handleAcceptAll}
                                    size="sm"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                                >
                                    Accept
                                </Button>
                            </div>
                        </div>

                        {/* Desktop: Bottom strip */}
                        <div className="hidden lg:block max-w-5xl mx-auto">
                            <div className="bg-[#0a0a0a] bg-opacity-95 backdrop-blur-sm border border-[var(--border)] rounded-xl px-4 py-3 shadow-2xl">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Cookie className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <p className="text-[var(--text-secondary)] text-sm">
                                            We use cookies to enhance your experience.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setShowSettings(true)}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs"
                                        >
                                            <Settings className="w-3 h-3 mr-1" />
                                            Customize
                                        </Button>
                                        <Button
                                            onClick={handleRejectAll}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs"
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            onClick={handleAcceptAll}
                                            size="sm"
                                            className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                                        >
                                            Accept All
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border)] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[var(--text-primary)]">Cookie Preferences</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Choose which cookies you want to accept. Necessary cookies cannot be disabled.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-green-500 mt-1" />
                                <div>
                                    <p className="text-[var(--text-primary)] font-medium">Necessary</p>
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        Required for the website to function
                                    </p>
                                </div>
                            </div>
                            <Switch checked={true} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Cookie className="w-5 h-5 text-blue-500 mt-1" />
                                <div>
                                    <p className="text-[var(--text-primary)] font-medium">Analytics</p>
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        Help us improve our website
                                    </p>
                                </div>
                            </div>
                            <Switch 
                                checked={preferences.analytics}
                                onCheckedChange={(checked) => 
                                    setPreferences({...preferences, analytics: checked})
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Cookie className="w-5 h-5 text-purple-500 mt-1" />
                                <div>
                                    <p className="text-[var(--text-primary)] font-medium">Marketing</p>
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        Personalized ads and content
                                    </p>
                                </div>
                            </div>
                            <Switch 
                                checked={preferences.marketing}
                                onCheckedChange={(checked) => 
                                    setPreferences({...preferences, marketing: checked})
                                }
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleRejectAll}
                            variant="outline"
                            className="flex-1"
                        >
                            Reject All
                        </Button>
                        <Button
                            onClick={handleSavePreferences}
                            className="bg-red-600 hover:bg-red-700 text-white flex-1"
                        >
                            Save Preferences
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}