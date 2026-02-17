import { getAiVisibilitySummary } from '../services/aiVisibilityService.js';
import { projectRepository } from '../repositories/projectRepository.js';

export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const range = req.query.range || '30d';

    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const summary = await getAiVisibilitySummary(projectId, userId, range);
    res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error('Get AI visibility summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load AI visibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
