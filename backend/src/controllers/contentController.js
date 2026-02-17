import { generateContent } from '../services/contentGenerationService.js';

export const generate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, projectId, platformIds } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required',
      });
    }

    const pid = parseInt(projectId, 10);
    if (!pid) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    const platforms = Array.isArray(platformIds) ? platformIds : (platformIds ? [platformIds] : []);
    if (platforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one platform is required',
      });
    }

    const result = await generateContent(userId, pid, topic.trim(), platforms);
    res.json(result);
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
