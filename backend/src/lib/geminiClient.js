/**
 * Single place for Gemini auth: loads backend/.env, trims key, avoids empty-key calls
 * that produce Google 403 "unregistered callers".
 */
import '../loadEnv.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

let cachedKey = '';
let genAI = null;

export function getGeminiApiKey() {
    return (
        process.env.GEMINI_API_KEY?.trim() ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
        ''
    );
}

/** Override with env e.g. gemini-2.0-flash if needed */
export function getDefaultGeminiModelName() {
    return process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
}

/** Onboarding competitor suggestions only — set e.g. gemini-2.0-flash for lower latency; falls back to GEMINI_MODEL / default. */
export function getCompetitorSuggestionModelName() {
    return process.env.GEMINI_ONBOARDING_MODEL?.trim() || getDefaultGeminiModelName();
}

/** @returns {import('@google/generative-ai').GoogleGenerativeAI} */
export function getGoogleGenerativeAI() {
    const key = getGeminiApiKey();
    if (!key) {
        const err = new Error('GEMINI_API_KEY is not configured');
        err.code = 'GEMINI_NOT_CONFIGURED';
        throw err;
    }
    if (!genAI || cachedKey !== key) {
        cachedKey = key;
        genAI = new GoogleGenerativeAI(key);
    }
    return genAI;
}

/** Default text model for content generation, etc. */
export function getGeminiGenerativeModel(modelName) {
    const client = getGoogleGenerativeAI();
    return client.getGenerativeModel({ model: modelName || getDefaultGeminiModelName() });
}

/** User-safe message for API responses */
export function formatGeminiErrorMessage(err) {
    const msg = err?.message || String(err);
    if (/GEMINI_NOT_CONFIGURED|GEMINI_API_KEY is not configured/i.test(msg)) {
        return 'AI is not configured. Set GEMINI_API_KEY in backend/.env and restart the API server.';
    }
    if (/403|Forbidden|unregistered callers|PERMISSION_DENIED|API key not valid|API_KEY_INVALID/i.test(msg)) {
        return [
            'Google Gemini rejected the request (403).',
            'Confirm GEMINI_API_KEY in backend/.env matches an active key from Google AI Studio, restart the server,',
            'enable the Generative Language API for that project, and set API key restrictions to “None” or “IP addresses” (not “HTTP referrers”) for server-side use.',
        ].join(' ');
    }
    return msg;
}
