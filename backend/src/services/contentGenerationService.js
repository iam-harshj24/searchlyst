import { brandProfileService } from './brandProfileService.js';
import { projectRepository } from '../repositories/projectRepository.js';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar';

const PLATFORM_SPECS = {
  linkedin: {
    name: 'LinkedIn Post',
    maxLength: 3000,
    style: 'Professional, concise, hook-driven. Use bullet points or short paragraphs. Include a strong opening and clear CTA.',
  },
  twitter: {
    name: 'Twitter / X',
    maxLength: 280,
    style: 'Punchy, conversational. Short sentences. Can use thread format (1/5, 2/5). Hashtags optional.',
  },
  blog: {
    name: 'Blog Article',
    maxLength: 2000,
    style: 'Longer form, SEO-friendly. Clear structure with headings. Engaging intro, valuable body, strong conclusion.',
  },
  newsletter: {
    name: 'Newsletter',
    maxLength: 1500,
    style: 'Personal, conversational. Direct address (you/your). Can be more casual. Include a clear takeaway.',
  },
  instagram: {
    name: 'Instagram Carousel',
    maxLength: 2200,
    style: 'Caption style. Engaging hook. Use line breaks. Call to action. Can include emojis sparingly.',
  },
};

function buildStyleContext(writingStyle) {
  if (!writingStyle || typeof writingStyle !== 'object') return '';
  const parts = [];
  if (writingStyle.tone) parts.push(`Tone: ${writingStyle.tone}`);
  if (writingStyle.vocabulary) parts.push(`Vocabulary: ${writingStyle.vocabulary}`);
  if (writingStyle.sentence_style) parts.push(`Sentence style: ${writingStyle.sentence_style}`);
  if (writingStyle.personality) parts.push(`Personality: ${writingStyle.personality}`);
  if (writingStyle.traits?.length) {
    parts.push('Traits: ' + writingStyle.traits.map(t => `${t.label}: ${t.value}`).join('; '));
  }
  return parts.length ? `\n\nWrite in this exact style:\n${parts.join('\n')}` : '';
}

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
      max_tokens: options.max_tokens ?? 1024,
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

export async function generateContentForPlatform(platformId, topic, brandProfile, platformName) {
  const spec = PLATFORM_SPECS[platformId] || PLATFORM_SPECS.blog;
  const styleContext = buildStyleContext(brandProfile?.writing_style_signature);
  const industry = brandProfile?.industry ? ` Industry: ${brandProfile.industry}.` : '';
  const audience = brandProfile?.target_audience ? ` Target audience: ${brandProfile.target_audience}.` : '';

  const prompt = `Write a ${spec.name} about this topic: "${topic}"
${industry}${audience}

Platform requirements: ${spec.style}
Keep under ${spec.maxLength} characters. Output ONLY the content, no meta-commentary.${styleContext}`;

  const content = await callPerplexity([{ role: 'user', content: prompt }], {
    max_tokens: Math.min(2048, Math.ceil(spec.maxLength / 2)),
  });

  return {
    platform: spec.name,
    title: topic.slice(0, 60) + (topic.length > 60 ? '...' : ''),
    content: content.trim(),
    ai_optimization_tips: [
      'Add relevant keywords for discoverability',
      'Include a clear call-to-action',
      'Use formatting (bullets, line breaks) for readability',
    ],
  };
}

export async function generateContent(userId, projectId, topic, platformIds) {
  const project = await projectRepository.findByUserIdAndId(userId, projectId);
  if (!project) throw new Error('Project not found');

  const brandProfile = await brandProfileService.getByProjectId(userId, projectId);
  const validPlatforms = (platformIds || []).filter(id => PLATFORM_SPECS[id]);

  if (validPlatforms.length === 0) {
    throw new Error('No valid platforms selected');
  }

  const contents = [];
  for (const platformId of validPlatforms) {
    const result = await generateContentForPlatform(
      platformId,
      topic,
      brandProfile,
      PLATFORM_SPECS[platformId]?.name
    );
    contents.push(result);
  }

  return { contents };
}
