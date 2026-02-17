import { projectService } from '../services/projectService.js';

export const listProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await projectService.listByUser(userId);
    res.json({ domains: projects, projects });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, url, status, visibility_score, total_citations, sentiment, issues_count } = req.body;
    const project = await projectService.create(userId, {
      name,
      url,
      status,
      visibility_score,
      total_citations,
      sentiment,
      issues_count,
    });
    res.status(201).json({ domain: project, project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
