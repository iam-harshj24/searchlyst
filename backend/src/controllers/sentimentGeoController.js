import {
  getSentimentGeoSummary,
  runSentimentGeoScan,
} from '../services/sentimentGeoService.js';
import { sentimentGeoRepository } from '../repositories/sentimentGeoRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';

export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const range = req.query.range || '30d';

    const summary = await getSentimentGeoSummary(projectId, userId, range);
    res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error('Get sentiment geo summary error:', error);
    const status = error.message === 'Project not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to get summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const runScan = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);

    const result = await runSentimentGeoScan(projectId, userId);
    res.status(201).json({
      success: true,
      message: 'Scan completed',
      scanned: result.scanned,
      prompts: result.prompts,
    });
  } catch (error) {
    console.error('Run sentiment geo scan error:', error);
    const status = error.message === 'Project not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to run scan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const listPrompts = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);

    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const prompts = await sentimentGeoRepository.findTrackedPromptsByProjectId(projectId);
    res.json({
      success: true,
      prompts: prompts.map((p) => ({
        id: p.id,
        query: p.query,
        source: p.source,
        created_at: p.created_at,
      })),
    });
  } catch (error) {
    console.error('List prompts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list prompts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const addPrompt = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const { query } = req.body || {};

    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const prompt = await sentimentGeoRepository.createTrackedPrompt(
      projectId,
      query.trim(),
      'user'
    );
    res.status(201).json({
      success: true,
      prompt: {
        id: prompt.id,
        query: prompt.query,
        source: prompt.source,
        created_at: prompt.created_at,
      },
    });
  } catch (error) {
    console.error('Add prompt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add prompt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const deletePrompt = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const promptId = parseInt(req.params.promptId, 10);

    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await sentimentGeoRepository.deleteTrackedPrompt(promptId, projectId);
    res.json({ success: true, message: 'Prompt deleted' });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prompt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
