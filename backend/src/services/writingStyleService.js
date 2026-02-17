const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar';

/**
 * Analyze writing style from concatenated post content using Perplexity API
 */
export async function analyzeWritingStyleWithPerplexity(content) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY is not configured');

  if (!content || content.trim().length < 50) {
    throw new Error('Not enough content to analyze. Connect more accounts and add posts.');
  }

  const prompt = `Analyze the following social media posts and extract the author's writing style.
Return a valid JSON object with these exact keys (no markdown, no code blocks):
- tone: string (e.g. "Professional & Authoritative", "Casual & Conversational")
- vocabulary: string (e.g. "Industry-Specific, Moderate Complexity")
- sentence_style: string (e.g. "Mix of Short & Medium, Active Voice")
- personality: string (e.g. "Thought Leader, Data-Driven")
- traits: array of objects with { label: string, value: string, confidence: number } where confidence is 0-100

Posts:
---
${content.slice(0, 15000)}
---`;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '{}';

  // Parse JSON - handle potential markdown code blocks
  let jsonStr = rawContent.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  try {
    return JSON.parse(jsonStr);
  } catch {
    return {
      tone: 'Unknown',
      vocabulary: 'Unknown',
      sentence_style: 'Unknown',
      personality: 'Unknown',
      traits: [
        { label: 'Tone', value: 'Could not parse', confidence: 0 },
      ],
    };
  }
}
