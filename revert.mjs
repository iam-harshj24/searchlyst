import fs from 'fs';

try {
    // 1. Revert OnboardingFlow.jsx
    let code = fs.readFileSync('src/components/dashboard/OnboardingFlow.jsx', 'utf8');

    // Remove Brand Knowledge State
    code = code.replace(/    \/\/ Step 2: Brand Knowledge[\s\S]*?const \[loadingSummary, setLoadingSummary\] = useState\(false\);/, '');

    // Fix totalSteps
    code = code.replace(/const totalSteps = isAddProject \? 5 : 7;/, 'const totalSteps = isAddProject ? 4 : 6;');

    // Revert handleStep1Continue back to simple setStep(2) with old Button format
    code = code.replace(/    const handleStep1Continue = async \(\) => {[\s\S]*?    };\n\n    const handleFinish = async \(\) => {/, '    const handleFinish = async () => {');

    // Remove brandSummary from userData
    code = code.replace(/\s*brandSummary,/, '');

    // Revert canProceed()
    code = code.replace(/            case 1: return domain\.trim\(\) && brandName\.trim\(\) && industry\.trim\(\);\n            case 2: return brandSummary\.trim\(\)\.length > 0;\n            case 3: return companySize;\n            case 4: return location\.trim\(\) && language && reach;\n            case 5: return competitors\.filter\(c => c\.trim\(\)\)\.length >= 1;\n            case 6: return true;\n            case 7: return true;/,
        `            case 1: return domain.trim() && brandName.trim() && industry.trim();
            case 2: return companySize;
            case 3: return location.trim() && language && reach;
            case 4: return competitors.filter(c => c.trim()).length >= 1;
            case 5: return true;
            case 6: return true;`);

    // Remove Step 2 UI block entirely
    code = code.replace(/                \{\/\* Step 2: Brand Knowledge \*\/\}[\s\S]*?\{\/\* Step 3: Company Details \*\/\}/, '{/* Step 2: Company Details */}');

    // Restore Step 1 Button
    code = code.replace(/<Button\s*onClick=\{handleStep1Continue\}\s*disabled=\{!canProceed\(\)\}\s*className=".+?"\s*>\s*Continue <ArrowRight className=".+?" \/>\s*<\/Button>/, '<Button onClick={() => setStep(2)} disabled={!canProceed()} className="w-full h-12 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-lg text-sm font-medium">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>');

    // Shift steps back up (7->6, 6->5, 5->4, 4->3, 3->2)
    code = code.replace(/setStep\(7\)/g, 'setStep(6)');
    code = code.replace(/step === 7/g, 'step === 6');
    code = code.replace(/setStep\(6\)/g, 'setStep(5)');
    code = code.replace(/step === 6/g, 'step === 5');
    code = code.replace(/setStep\(5\)/g, 'setStep(4)');
    code = code.replace(/step === 5/g, 'step === 4');
    code = code.replace(/setStep\(4\)/g, 'setStep(3)');
    code = code.replace(/step === 4/g, 'step === 3');
    code = code.replace(/setStep\(3\)/g, 'setStep(2)');
    code = code.replace(/step === 3/g, 'step === 2');
    code = code.replace(/\{\/\* Step 3: Company Details \*\/\}/g, '{/* Step 2: Company Details */}');
    code = code.replace(/\{\/\* Step 4: Location/g, '{/* Step 3: Location');
    code = code.replace(/\{\/\* Step 5: Competitors/g, '{/* Step 4: Competitors');
    code = code.replace(/\{\/\* Step 6: Source/g, '{/* Step 5: Source');
    code = code.replace(/\{\/\* Step 7: Generating/g, '{/* Step 6: Generating');

    fs.writeFileSync('src/components/dashboard/OnboardingFlow.jsx', code);

    // 2. Revert backend aiService.js
    let aiService = fs.readFileSync('backend/src/services/aiService.js', 'utf8');
    aiService = aiService.replace(/\n\/\/ PROMPT: Brand Knowledge Summary[\s\S]*?}$/, '');
    fs.writeFileSync('backend/src/services/aiService.js', aiService);

    // 3. Revert onboardingController.js
    let controller = fs.readFileSync('backend/src/controllers/onboardingController.js', 'utf8');
    controller = controller.replace(/, generateBrandSummary /, ' ');
    controller = controller.replace(/\n+export async function getBrandSummary[\s\S]*?}$/, '');
    fs.writeFileSync('backend/src/controllers/onboardingController.js', controller);

    // 4. Revert onboarding.js
    let routes = fs.readFileSync('backend/src/routes/onboarding.js', 'utf8');
    routes = routes.replace(/, getBrandSummary /, ' ');
    routes = routes.replace(/\nrouter\.post\('\/brand-summary', getBrandSummary\);/, '');
    fs.writeFileSync('backend/src/routes/onboarding.js', routes);

    // 5. Revert apiClient.js
    let apiClient = fs.readFileSync('src/api/apiClient.js', 'utf8');
    apiClient = apiClient.replace(/,\s*async getBrandSummary\(data\) \{\s*return apiClient\.post\('\/onboarding\/brand-summary', data\);\s*\}/, '');
    fs.writeFileSync('src/api/apiClient.js', apiClient);

    console.log('Successfully reverted code.');
} catch (e) {
    console.error('Error during revert:', e);
}
