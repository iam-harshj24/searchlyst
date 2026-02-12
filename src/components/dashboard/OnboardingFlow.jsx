import React, { useState } from 'react';
import { 
    Rocket, Palette, Megaphone, ArrowRight, Sparkles, Globe,
    Users, MapPin, Loader2, Building2
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

const roles = [
    { 
        id: 'founder', 
        label: 'Founder', 
        icon: Rocket, 
        desc: 'Build authority, attract investors & customers through AI-optimized thought leadership',
        color: 'from-purple-500 to-indigo-500',
        borderActive: 'border-purple-500/50',
        bgActive: 'bg-purple-500/10'
    },
    { 
        id: 'creator', 
        label: 'Creator', 
        icon: Palette, 
        desc: 'Scale your content across platforms with your unique style — newsletters, blogs, carousels',
        color: 'from-pink-500 to-rose-500',
        borderActive: 'border-pink-500/50',
        bgActive: 'bg-pink-500/10'
    },
    { 
        id: 'influencer', 
        label: 'Influencer', 
        icon: Megaphone, 
        desc: 'Grow your reach, get cited by AI engines, and land brand deals with data-backed presence',
        color: 'from-amber-500 to-orange-500',
        borderActive: 'border-amber-500/50',
        bgActive: 'bg-amber-500/10'
    },
];

export default function OnboardingFlow({ onComplete }) {
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState('');
    const [industry, setIndustry] = useState('');
    const [audience, setAudience] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [saving, setSaving] = useState(false);

    const handleFinish = async () => {
        setSaving(true);
        await base44.auth.updateMe({
            role_type: selectedRole,
            industry,
            target_audience: audience,
            location,
            website_url: website,
            onboarded: true,
        });
        setSaving(false);
        onComplete(selectedRole);
    };

    const selectedRoleData = roles.find(r => r.id === selectedRole);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-white/[0.06]">
                            <div className={`h-full rounded-full transition-all duration-500 ${
                                s <= step ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 w-full' : 'w-0'
                            }`} />
                        </div>
                    ))}
                </div>

                {/* Step 1: Role */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-semibold text-white">Welcome to ContentAI</h1>
                            <p className="text-white/40 text-sm mt-2">Tell us who you are so we can personalize your experience</p>
                        </div>

                        <div className="space-y-3">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 ${
                                            isSelected 
                                                ? `${role.bgActive} ${role.borderActive}` 
                                                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${role.color} shadow-lg`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{role.label}</p>
                                                <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{role.desc}</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                isSelected ? `${role.borderActive} bg-white` : 'border-white/10'
                                            }`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            onClick={() => setStep(2)}
                            disabled={!selectedRole}
                            className="w-full h-12 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl hover:opacity-90 text-sm font-medium mt-4"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-semibold text-white">Tell us about your work</h2>
                            <p className="text-white/40 text-sm mt-1">This helps us find the right topics and audience for you</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {selectedRole === 'founder' ? 'What industry are you in?' : 
                                     selectedRole === 'creator' ? 'What niche do you create in?' : 
                                     'What space are you in?'}
                                </label>
                                <Input 
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    placeholder={selectedRole === 'founder' ? 'e.g. SaaS, HealthTech, FinTech' :
                                                 selectedRole === 'creator' ? 'e.g. Design, Marketing, Tech' :
                                                 'e.g. Fashion, Fitness, Travel'}
                                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11"
                                />
                            </div>
                            <div>
                                <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" />
                                    Who's your target audience?
                                </label>
                                <Input 
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                    placeholder={selectedRole === 'founder' ? 'e.g. Startup founders, CTOs, VCs' :
                                                 selectedRole === 'creator' ? 'e.g. Designers, Marketers, Developers' :
                                                 'e.g. Gen Z, Fitness enthusiasts, Luxury buyers'}
                                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11"
                                />
                            </div>
                            <div>
                                <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    Primary location / market
                                </label>
                                <Input 
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. San Francisco, London, Global"
                                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-11 border-white/[0.06] text-white/40 hover:text-white rounded-xl">
                                Back
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!industry.trim() || !audience.trim()}
                                className="flex-1 h-11 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl hover:opacity-90"
                            >
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Website */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-semibold text-white">Add your website <span className="text-white/30 text-sm">(optional)</span></h2>
                            <p className="text-white/40 text-sm mt-1">We'll run a free SEO, AEO & GEO audit automatically</p>
                        </div>

                        <div>
                            <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" />
                                Your website or web app
                            </label>
                            <Input 
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11"
                            />
                        </div>

                        {/* Summary card */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3">Your profile</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/40">Role</span>
                                    <span className="text-white capitalize">{selectedRole}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/40">{selectedRole === 'founder' ? 'Industry' : 'Niche'}</span>
                                    <span className="text-white">{industry}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/40">Audience</span>
                                    <span className="text-white">{audience}</span>
                                </div>
                                {location && (
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Location</span>
                                        <span className="text-white">{location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-11 border-white/[0.06] text-white/40 hover:text-white rounded-xl">
                                Back
                            </Button>
                            <Button
                                onClick={handleFinish}
                                disabled={saving}
                                className="flex-1 h-11 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl hover:opacity-90"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Launch My Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}