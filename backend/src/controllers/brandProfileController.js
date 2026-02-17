import { brandProfileService } from '../services/brandProfileService.js';
import { socialConnectionService } from '../services/socialConnectionService.js';

export const getBrandProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const profile = await brandProfileService.getByProjectId(userId, projectId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Project or profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Get brand profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get brand profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const updateBrandProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const { role_type, industry, target_audience, location, website_url, social_linkedin, social_instagram, social_substack, social_twitter } = req.body;

    const profile = await brandProfileService.upsert(userId, projectId, {
      role_type,
      industry,
      target_audience,
      location,
      website_url,
    });

    // Sync social connections from profile
    const socialPlatforms = [
      { key: 'social_linkedin', platform: 'linkedin' },
      { key: 'social_instagram', platform: 'instagram' },
      { key: 'social_substack', platform: 'substack' },
      { key: 'social_twitter', platform: 'twitter' },
    ];

    for (const { key, platform } of socialPlatforms) {
      const value = req.body[key];
      if (value && value.trim()) {
        await socialConnectionService.upsertConnection(userId, platform, value.trim());
      }
    }

    res.json(profile);
  } catch (error) {
    console.error('Update brand profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update brand profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
