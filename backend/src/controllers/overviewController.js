import { getOverview } from '../services/overviewService.js';

export const getOverviewData = async (req, res) => {
  try {
    const userId = req.user.id;
    const activeProjectId = req.query.activeProjectId
      ? parseInt(req.query.activeProjectId, 10)
      : null;

    const overview = await getOverview(userId, activeProjectId);
    res.json({
      success: true,
      ...overview,
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load overview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
