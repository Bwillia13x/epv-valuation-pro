// EPV Valuation Pro - Cases API
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/database';
import { withAuth } from '../../../lib/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const userId = (req as any).userId; // Set by auth middleware

  switch (method) {
    case 'GET':
      return getCases(req, res, userId);
    case 'POST':
      return createCase(req, res, userId);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// GET /api/cases - List all cases for user
async function getCases(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const where: any = { userId };

    // Add status filter
    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }

    // Add search filter
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
        include: {
          analyses: {
            select: {
              id: true,
              agentType: true,
              recommendation: true,
              confidence: true,
              completedAt: true,
            },
          },
          _count: {
            select: { analyses: true },
          },
        },
      }),
      prisma.case.count({ where }),
    ]);

    res.status(200).json({
      cases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
}

// POST /api/cases - Create new case
async function createCase(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { name, industry, analysisType, financialData, assumptions } =
      req.body;

    // Validate required fields
    if (!name || !financialData) {
      return res.status(400).json({
        error: 'Missing required fields: name and financialData are required',
      });
    }

    const newCase = await prisma.case.create({
      data: {
        name,
        industry: industry || 'Healthcare Services',
        analysisType: analysisType || 'EPV',
        financialData,
        assumptions: assumptions || {
          discountRate: 12,
          growthRate: 3,
          terminalMultiple: 2.5,
        },
        userId,
        status: 'DRAFT',
      },
      include: {
        analyses: true,
        _count: {
          select: { analyses: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        caseId: newCase.id,
        action: 'CREATE',
        entity: 'Case',
        entityId: newCase.id,
        newValues: {
          name,
          industry,
          analysisType,
        },
        metadata: {
          source: 'api',
          userAgent: req.headers['user-agent'],
        },
      },
    });

    res.status(201).json(newCase);
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
}

export default withAuth(handler);
