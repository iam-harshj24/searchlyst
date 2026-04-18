import fs from 'fs';

let code = fs.readFileSync('src/components/dashboard/OnboardingFlow.jsx', 'utf8');

// Replace step variables, moving existing steps 6,5,4,3,2 down by 1
code = code.replace(/setStep\(6\)/g, 'setStep(7)');
code = code.replace(/step === 6/g, 'step === 7');

code = code.replace(/setStep\(5\)/g, 'setStep(6)');
code = code.replace(/step === 5/g, 'step === 6');

code = code.replace(/setStep\(4\)/g, 'setStep(5)');
code = code.replace(/step === 4/g, 'step === 5');

code = code.replace(/setStep\(3\)/g, 'setStep(4)');
code = code.replace(/step === 3/g, 'step === 4');

code = code.replace(/setStep\(2\)/g, 'setStep(3)');
code = code.replace(/step === 2/g, 'step === 3');

// Fix the fetchCompetitorSuggestions effect condition (which is now step 5)
code = code.replace(/step === 5 && domain && brandName && industry && suggestedCompetitors\.length === 0/g, 'step === 5 && domain && brandName && industry && suggestedCompetitors.length === 0');

// Inject new state variables
const stateVars = `    const [industry, setIndustry] = useState('');

    // Step 2: Brand Knowledge
    const [brandSummary, setBrandSummary] = useState('');
    const [loadingSummary, setLoadingSummary] = useState(false);`;
code = code.replace(/const \[industry, setIndustry\] = useState\(''\);/, stateVars);

// Fix totalSteps
const totalStepsCode = `// addProject mode: 5 steps (basic, brand, company, location, competitors)
    // firstTime mode: 7 steps (+ source + generating)
    const totalSteps = isAddProject ? 5 : 7;`;
code = code.replace(/const totalSteps = isAddProject \? 4 : 6;/, totalStepsCode);

// Inject handleStep1Continue before handleFinish
const handleStep1 = `    const handleStep1Continue = async () => {
        setStep(2);
        if (!brandSummary) {
            setLoadingSummary(true);
            try {
                const response = await apiClient.onboarding.getBrandSummary({ domain, brandName, industry });
                if (response.success && response.summary) {
                    setBrandSummary(response.summary);
                }
            } catch (error) {
                console.error('Failed to generate brand summary:', error);
                setBrandSummary(\`\${brandName} operates in the \${industry} space, providing innovative solutions to their target audience.\`);
            } finally {
                setLoadingSummary(false);
            }
        }
    };

    const handleFinish = async () => {`;
code = code.replace('const handleFinish = async () => {', handleStep1);

// Inside handleFinish, save brandSummary inside userData
code = code.replace(/language,\n\s*reach,\n\s*competitors:/, `language,
            reach,
            brandSummary,
            competitors:`);

// Update canProceed()
const canProceedCode = `            case 1: return domain.trim() && brandName.trim() && industry.trim();
            case 2: return brandSummary.trim().length > 0;
            case 3: return companySize;
            case 4: return location.trim() && language && reach;
            case 5: return competitors.filter(c => c.trim()).length >= 1;
            case 6: return true;
            case 7: return true;`;
code = code.replace(/case 1:[\\s\\S]*?case 5: return true;/, canProceedCode);

// Inject Step 2 UI before Step 3
const step2UI = `                {/* Step 2: Brand Knowledge */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Review brand knowledge</h1>
                            <p className="text-gray-500 mt-1">This description should match {brandName}. You can edit it for a better fit.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-5 h-5 text-gray-400" />
                                <span className="font-medium text-gray-900">Brand Summary</span>
                            </div>
                            
                            <div className="relative">
                                {loadingSummary && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
                                        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                                    </div>
                                )}
                                <textarea
                                    value={brandSummary}
                                    onChange={(e) => setBrandSummary(e.target.value)}
                                    className="w-full min-h-[160px] p-4 rounded-xl border border-gray-200 text-gray-900 bg-white focus:border-red-500 focus:ring-red-500 resize-y leading-relaxed shadow-sm"
                                    placeholder="Generating your brand summary..."
                                />
                            </div>
                            <p className="text-sm text-gray-500">Helps Searchlyst understand what your brand is about.</p>
                        </div>

                        <div className="flex justify-between gap-3 pt-4">
                            <Button
                                onClick={() => { setBrandSummary(''); setLoadingSummary(false); setStep(1); }}
                                variant="outline"
                                className="h-12 border-gray-200 text-gray-600 hover:bg-gray-50 px-6"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Start Over
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!canProceed()}
                                className="h-12 bg-[#333b4d] hover:bg-gray-800 text-white rounded-lg px-8 flex items-center shadow-sm"
                            >
                                Continue: Select Markets <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Company Details */}`;
code = code.replace('{/* Step 3: Company Details */}', step2UI);

// Update Step 1 Continue button to call handleStep1Continue instead of setStep(3)
const step1Button = `<Button
                            onClick={handleStep1Continue}
                            disabled={!canProceed()}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-lg text-sm font-medium"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>`;
code = code.replace(/<Button\s*onClick=\{\(\) => setStep\(3\)\}\s*disabled=\{!canProceed\(\)\}\s*className="w-full h-12 bg-red-600 hover:bg-red-700 text-\[var\(--text-primary\)\] rounded-lg text-sm font-medium"\s*>\s*Continue <ArrowRight className="w-4 h-4 ml-2" \/>\s*<\/Button>/, step1Button);


fs.writeFileSync('src/components/dashboard/OnboardingFlow.jsx', code);
console.log('Successfully updated OnboardingFlow.jsx');
