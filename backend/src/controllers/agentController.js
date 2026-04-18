import { chatWithAgent } from '../services/aiService.js';

export async function chat(req, res) {
    try {
        const { messages, brandContext, analyticsSnapshot } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, message: 'messages array is required' });
        }

        const reply = await chatWithAgent({ messages, brandContext, analyticsSnapshot });
        return res.json({ success: true, reply });
    } catch (err) {
        if (err.message?.includes('GEMINI_API_KEY')) {
            return res.status(503).json({
                success: false,
                message: 'AI service is not configured. Set GEMINI_API_KEY in backend .env',
            });
        }
        console.error('[Agent Chat]', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to get AI response',
        });
    }
}
