import { suggestCompetitors } from '../services/aiService.js';

export async function getCompetitorSuggestions(req, res) {
    try {
        const { domain, brandName, industry, companySize, location, language, reach } = req.body;

        if (!domain || !brandName || !industry) {
            return res.status(400).json({
                success: false,
                message: 'domain, brandName, and industry are required',
            });
        }

        const competitors = await suggestCompetitors({
            domain,
            brandName,
            industry,
            companySize,
            location,
            language,
            reach,
        });

        res.json({ success: true, competitors });
    } catch (error) {
        console.error('Competitor suggestion error:', error.message);

        if (error.message.includes('GEMINI_API_KEY')) {
            return res.status(503).json({
                success: false,
                code: 'NOT_CONFIGURED',
                message: 'AI service is not configured. Set GEMINI_API_KEY in backend .env',
            });
        }

        if (error.message.includes('429') || error.message.includes('quota')) {
            return res.status(429).json({
                success: false,
                code: 'RATE_LIMITED',
                message: 'AI quota temporarily exhausted. Try again in a minute, or enter competitors manually.',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to generate competitor suggestions',
        });
    }
}

export async function getBrandSummary(req, res) {
    try {
        const { domain, brandName, industry } = req.body;

        if (!domain || !brandName || !industry) {
            return res.status(400).json({
                success: false,
                message: 'domain, brandName, and industry are required',
            });
        }

        const summary = await generateBrandSummary({ domain, brandName, industry });
        res.json({ success: true, summary });
    } catch (error) {
        console.error('Brand summary error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to generate brand summary',
        });
    }
}
