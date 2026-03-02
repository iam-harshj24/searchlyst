import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load .env
config();

async function checkGemini() {
    console.log('\n--- Checking Gemini API ---');
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log('❌ GEMINI_API_KEY is not set in .env');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent('Say exactly the word "Hello"');
        const text = result.response.text().trim();
        console.log('✅ Gemini is working. Response:', text);
    } catch (err) {
        console.log('❌ Gemini connection failed:', err.message);
    }
}

async function checkFirecrawl() {
    console.log('\n--- Checking Firecrawl API ---');
    const key = process.env.FIRECRAWL_API_KEY;
    if (!key) {
        console.log('❌ FIRECRAWL_API_KEY is not set in .env');
        return;
    }

    try {
        const res = await fetch('https://api.firecrawl.dev/v1/crawl', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: 'https://example.com', scrapeOptions: { formats: ['html'] } })
        });

        if (res.ok || res.status === 402 /* Payment Required */) {
            console.log('✅ Firecrawl is responding (Status:', res.status + ')');
        } else {
            console.log('❌ Firecrawl responded with an error:', res.status, await res.text());
        }
    } catch (err) {
        console.log('❌ Firecrawl connection failed:', err.message);
    }
}

async function checkInfatica() {
    console.log('\n--- Checking Infatica API ---');
    const key = process.env.INFATICA_API_KEY;
    if (!key) {
        console.log('❌ INFATICA_API_KEY is not set in .env');
        return;
    }

    try {
        const res = await fetch('https://scrape.infatica.io/perplexity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
            body: JSON.stringify({ query: 'hello world' }),
        });

        if (res.ok || res.status === 401 || res.status === 402 || res.status === 403) {
            console.log('✅ Infatica is responding (Status:', res.status + ')');
        } else {
            console.log('❌ Infatica responded with an error:', res.status, await res.text());
        }
    } catch (err) {
        console.log('❌ Infatica connection failed:', err.message);
    }
}

async function runTests() {
    console.log('Starting API checks...');
    await checkGemini();
    await checkFirecrawl();
    await checkInfatica();
    console.log('\nFinished testing.');
}

runTests();
