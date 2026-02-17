import { socialConnectionRepository } from '../repositories/socialConnectionRepository.js';
import { brandProfileRepository } from '../repositories/brandProfileRepository.js';
import { fetchContentFromPlatform } from './contentFetcherService.js';
import { analyzeWritingStyleWithPerplexity } from './writingStyleService.js';
import prisma from '../lib/prisma.js';

export const socialConnectionService = {
  async listConnections(userId) {
    const connections = await socialConnectionRepository.findByUserId(userId);
    return connections.map((c) => ({
      platform: c.platform,
      handle_or_url: c.handle_or_url,
      connection_type: c.connection_type,
      status: c.status,
      last_fetched_at: c.last_fetched_at,
    }));
  },

  async upsertConnection(userId, platform, handleOrUrl) {
    const normalized = String(handleOrUrl || '').trim();
    if (!normalized) {
      throw new Error('Handle or URL is required');
    }

    return socialConnectionRepository.upsert(userId, platform, {
      connection_type: 'manual',
      handle_or_url: normalized,
      status: 'active',
    });
  },

  async deleteConnection(userId, platform) {
    return socialConnectionRepository.delete(userId, platform);
  },

  async fetchAndAnalyze(userId, projectId) {
    const connections = await socialConnectionRepository.findByUserId(userId);
    const activeConnections = connections.filter((c) => c.status === 'active' && c.handle_or_url);

    if (activeConnections.length === 0) {
      throw new Error('No connected accounts. Add LinkedIn, Twitter, Instagram, or Substack URLs first.');
    }

    const allContent = [];
    const analyzedPlatforms = [];

    for (const conn of activeConnections) {
      try {
        const posts = await fetchContentFromPlatform(conn.platform, conn.handle_or_url);
        const texts = posts.map((p) => p.text).filter(Boolean);

        if (texts.length > 0) {
          analyzedPlatforms.push(conn.platform);
          await prisma.fetchedContent.deleteMany({
            where: { social_connection_id: conn.id },
          });
          await prisma.fetchedContent.createMany({
            data: posts.slice(0, 10).map((p) => ({
              social_connection_id: conn.id,
              platform: conn.platform,
              raw_content: p.text || '',
              post_id: p.id || null,
              post_url: p.url || null,
            })),
          });
          allContent.push(...texts);
        }

        await prisma.socialConnection.update({
          where: { id: conn.id },
          data: { last_fetched_at: new Date() },
        });
      } catch (err) {
        console.error(`Failed to fetch ${conn.platform}:`, err.message);
        // Continue with other platforms
      }
    }

    const combinedContent = allContent.join('\n---\n');
    if (combinedContent.length < 50) {
      throw new Error(
        'Could not fetch enough content. Check that your profiles are public and URLs are correct.'
      );
    }

    const signature = await analyzeWritingStyleWithPerplexity(combinedContent);
    signature.analyzed_from_platforms = analyzedPlatforms;

    await brandProfileRepository.updateWritingStyle(projectId, signature, new Date());

    return {
      writing_style_signature: signature,
      analyzed_from_platforms: analyzedPlatforms,
    };
  },
};
