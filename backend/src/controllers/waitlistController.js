import { waitlistService } from '../services/waitlistService.js';

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
