// EPV Valuation Pro - Single Case API
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/database';
import { withAuth } from '../../../lib/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;
  const userId = (req as any).userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid case ID' });
  }

  switch (method) {
    case 'GET':
      return getCase(req, res, userId, id);
    case 'PUT':
      return updateCase(req, res, userId, id);
    case 'DELETE':
      return deleteCase(req, res, userId, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// GET /api/cases/[id] - Get single case
async function getCase(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  caseId: string
) {
  try {
    const case_ = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId, // Ensure user can only access their own cases
      },
      include: {
        analyses: {
          orderBy: { completedAt: 'desc' },
        },
        caseShares: {
          where: {
            OR: [{ sharedWith: userId }, { case: { userId } }],
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
          },
        },
      },
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.status(200).json(case_);
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
}

// PUT /api/cases/[id] - Update case
async function updateCase(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  caseId: string
) {
  try {
    const { name, industry, status, financialData, assumptions } = req.body;

    // Check if case exists and belongs to user
    const existingCase = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (industry !== undefined) updateData.industry = industry;
    if (status !== undefined) updateData.status = status;
    if (financialData !== undefined) updateData.financialData = financialData;
    if (assumptions !== undefined) updateData.assumptions = assumptions;

    // Update version number
    updateData.version = existingCase.version + 1;

    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: updateData,
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
        caseId,
        action: 'UPDATE',
        entity: 'Case',
        entityId: caseId,
        oldValues: {
          name: existingCase.name,
          industry: existingCase.industry,
          status: existingCase.status,
          version: existingCase.version,
        },
        newValues: updateData,
        metadata: {
          source: 'api',
          userAgent: req.headers['user-agent'],
        },
      },
    });

    res.status(200).json(updatedCase);
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
}

// DELETE /api/cases/[id] - Delete case
async function deleteCase(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  caseId: string
) {
  try {
    // Check if case exists and belongs to user
    const existingCase = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Delete case (cascade will handle related records)
    await prisma.case.delete({
      where: { id: caseId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Case',
        entityId: caseId,
        oldValues: {
          name: existingCase.name,
          industry: existingCase.industry,
          status: existingCase.status,
        },
        metadata: {
          source: 'api',
          userAgent: req.headers['user-agent'],
          deletedAt: new Date(),
        },
      },
    });

    res.status(200).json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
}

export default withAuth(handler);
