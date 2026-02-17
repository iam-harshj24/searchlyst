const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar'; // sonar has web search built-in

const SYSTEM_PROMPT = `You are Searchlyst's AI Assistant, helping users with AI search optimization, content strategy, and brand visibility. You're knowledgeable about:
- AI Search Optimization (AEO) and how brands get recommended by ChatGPT, Perplexity, Claude, and Gemini
- Content creation, writing style, and platform-specific best practices
- SEO, visibility audits, and trending topics
Be concise, helpful, and actionable. Use markdown for formatting when appropriate.`;

async function callPerplexity(messages, options = {}) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY is not configured');

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages,
      max_tokens: options.max_tokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function chat(messages) {
  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];
  return callPerplexity(fullMessages);
}
