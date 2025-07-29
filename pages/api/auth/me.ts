// EPV Valuation Pro - Get Current User API
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/auth';
import { prisma } from '../../../lib/database';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = (req as any).userId;

    // Get user with additional stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            cases: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        action: true,
        entity: true,
        timestamp: true,
        metadata: true,
      },
    });

    res.status(200).json({
      user,
      stats: {
        totalCases: user._count.cases,
        totalActions: user._count.auditLogs,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
}

export default withAuth(handler);
