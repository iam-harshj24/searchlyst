import { waitlistService } from '../services/waitlistService.js';
import { addWelcomeEmailJob, welcomeEmailQueue } from '../queues/welcomeEmailQueue.js';

export const createWaitlistEntry = async (req, res) => {
  const { full_name, email, website_url, source } = req.body;

  try {
    const result = await waitlistService.createEntry({
      full_name,
      email,
      website_url,
      source,
    });

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: 'This email is already on the waitlist',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Successfully added to waitlist',
      data: result.data,
    });
  } catch (error) {
    console.error('Error creating waitlist entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to waitlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getAllWaitlistEntries = async (req, res) => {
  try {
    const entries = await waitlistService.getAllEntries();

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waitlist entries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const updateWaitlistStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const entryId = parseInt(id, 10);

  if (isNaN(entryId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid waitlist entry ID',
    });
  }

  try {
    const entry = await waitlistService.updateStatus(entryId, status);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: entry,
    });
  } catch (error) {
    console.error('Error updating waitlist status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getWaitlistStats = async (req, res) => {
  try {
    const data = await waitlistService.getStats();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching waitlist stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const bulkCreateEntries = async (req, res) => {
  const { entries } = req.body;

  try {
    const result = await waitlistService.bulkCreateEntries(entries);

    res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      data: {
        created: result.created.length,
        skipped: result.skipped.length,
        errors: result.errors.length,
        details: {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        },
      },
    });
  } catch (error) {
    console.error('Error bulk creating waitlist entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk upload waitlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const sendWelcomeBulk = async (req, res) => {
  const { entryIds } = req.body;

  try {
    const jobId = await addWelcomeEmailJob(entryIds);
    res.status(202).json({
      success: true,
      message: 'Welcome email job started',
      data: { jobId: String(jobId), total: entryIds.length },
    });
  } catch (error) {
    console.error('Error starting welcome email job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start welcome email job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getWelcomeJobStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await welcomeEmailQueue.getJob(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const state = await job.getState();
    const progress = job.progress();
    const total = job.data?.entryIds?.length ?? 0;

    let status = 'running';
    if (state === 'completed') status = 'completed';
    else if (state === 'failed') status = 'failed';
    else if (state === 'waiting' || state === 'active') status = 'running';
    else if (state === 'delayed') status = 'running';

    const sent = typeof progress === 'object' && progress?.sent != null ? progress.sent : 0;
    const failed = typeof progress === 'object' && progress?.failed != null ? progress.failed : 0;
    const errors = typeof progress === 'object' && Array.isArray(progress?.errors) ? progress.errors : [];

    let resultData = { sent, failed, errors, total };
    if (state === 'completed' && job.returnvalue) {
      resultData = { ...resultData, ...job.returnvalue };
    }
    if (state === 'failed' && job.failedReason) {
      resultData = { ...resultData, error: job.failedReason };
    }

    res.status(200).json({
      success: true,
      data: { status, ...resultData },
    });
  } catch (error) {
    console.error('Error fetching welcome job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
