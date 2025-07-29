// EPV Valuation Pro - Case Sharing API
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/auth';
import { prisma } from '../../../../lib/database';
import { AuditService } from '../../../../lib/services/AuditService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;
  const userId = (req as any).userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid case ID' });
  }

  switch (method) {
    case 'GET':
      return getCaseShares(req, res, userId, id);
    case 'POST':
      return shareCase(req, res, userId, id);
    case 'DELETE':
      return revokeShare(req, res, userId, id);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// GET /api/cases/[id]/share - Get case sharing info
async function getCaseShares(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  caseId: string
) {
  try {
    // Check if user owns the case
    const case_ = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found or access denied' });
    }

    // Get all shares for this case
    const shares = await prisma.caseShare.findMany({
      where: { caseId },
      orderBy: { sharedAt: 'desc' },
    });

    res.status(200).json({ shares });
  } catch (error) {
    console.error('Get case shares error:', error);
    res.status(500).json({ error: 'Failed to fetch case shares' });
  }
}

// POST /api/cases/[id]/share - Share case with someone
async function shareCase(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  caseId: string
) {
  try {
    const { sharedWith, permission = 'READ', expiresAt } = req.body;

    if (!sharedWith) {
      return res.status(400).json({ error: 'sharedWith is required' });
    }

    // Check if user owns the case
    const case_ = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found or access denied' });
    }

    // Validate permission level
    const validPermissions = ['READ', 'COMMENT', 'EDIT', 'ADMIN'];
    if (!validPermissions.includes(permission)) {
      return res.status(400).json({ error: 'Invalid permission level' });
    }

    // Create or update share
    const share = await prisma.caseShare.upsert({
      where: {
        caseId_sharedWith: {
          caseId,
          sharedWith,
        },
      },
      update: {
        permission,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        sharedAt: new Date(),
      },
      create: {
        caseId,
        sharedWith,
        permission,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Create audit log
    await AuditService.logCaseAction(
      userId,
      caseId,
      'SHARE',
      undefined,
      {
        sharedWith,
        permission,
        expiresAt,
      },
      {
        shareId: share.id,
        action: 'share_case',
      }
    );

    res.status(201).json({
      message: 'Case shared successfully',
      share,
    });
  } catch (error) {
    console.error('Share case error:', error);
    res.status(500).json({ error: 'Failed to share case' });
  }
}

// DELETE /api/cases/[id]/share - Revoke case sharing
async function revokeShare(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  caseId: string
) {
  try {
    const { sharedWith } = req.body;

    if (!sharedWith) {
      return res.status(400).json({ error: 'sharedWith is required' });
    }

    // Check if user owns the case
    const case_ = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found or access denied' });
    }

    // Delete share
    const deletedShare = await prisma.caseShare.delete({
      where: {
        caseId_sharedWith: {
          caseId,
          sharedWith,
        },
      },
    });

    // Create audit log
    await AuditService.logCaseAction(
      userId,
      caseId,
      'UNSHARE',
      {
        sharedWith: deletedShare.sharedWith,
        permission: deletedShare.permission,
      },
      undefined,
      {
        action: 'revoke_share',
      }
    );

    res.status(200).json({
      message: 'Case sharing revoked successfully',
    });
  } catch (error) {
    console.error('Revoke share error:', error);
    res.status(500).json({ error: 'Failed to revoke case sharing' });
  }
}

export default withAuth(handler);
