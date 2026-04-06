import prisma from '../lib/prisma.js';

export const getOverview = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalProjects = await prisma.project.count();
    const totalContent = await prisma.content.count();
    const waitlistCount = await prisma.waitlist.count();
    const recentUsers = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProjects,
        totalContent,
        waitlistCount,
        recentUsers,
      }
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch overview data' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role_type: true,
        onboarded: true,
        auth_provider: true,
        created_at: true,
        _count: {
          select: { projects: true }
        }
      }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users data' });
  }
};

export const getContents = async (req, res) => {
  try {
    const contents = await prisma.content.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        },
        project: {
          select: { brandName: true }
        }
      }
    });
    res.json({ success: true, data: contents });
  } catch (error) {
    console.error('Error fetching admin contents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contents data' });
  }
};
