import { socialConnectionService } from '../services/socialConnectionService.js';

export const listConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const connections = await socialConnectionService.listConnections(userId);
    res.json({ connections });
  } catch (error) {
    console.error('List connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list connections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const analyzeWritingStyle = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.body.projectId, 10);
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    const result = await socialConnectionService.fetchAndAnalyze(userId, projectId);
    res.json(result);
  } catch (error) {
    console.error('Analyze writing style error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze writing style',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
