// EPV Valuation Pro - Audit Logs API
import { NextApiRequest, NextApiResponse } from 'next';
import { withManager } from '../../../lib/middleware/auth';
import { AuditService } from '../../../lib/services/AuditService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getAuditLogs(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// GET /api/audit/logs - Get audit logs (Manager+ only)
async function getAuditLogs(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      userId,
      caseId,
      entity,
      action,
      dateFrom,
      dateTo,
      page = '1',
      limit = '50',
      export: exportFlag,
    } = req.query;

    const query = {
      userId: userId as string,
      caseId: caseId as string,
      entity: entity as string,
      action: action as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    if (exportFlag === 'true') {
      // Export logs as CSV
      const logs = await AuditService.exportLogs(query);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=audit-logs.csv'
      );

      // Convert to CSV
      const csvHeaders =
        'Timestamp,User,Action,Entity,Entity ID,IP Address,User Agent,Changes\n';
      const csvRows = logs
        .map(
          (log) =>
            `"${log.timestamp}","${log.user}","${log.action}","${log.entity}","${log.entityId || ''}","${log.ipAddress || ''}","${log.userAgent || ''}","${JSON.stringify(log.changes).replace(/"/g, '""')}"`
        )
        .join('\n');

      return res.status(200).send(csvHeaders + csvRows);
    }

    const result = await AuditService.queryLogs(query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

export default withManager(handler);
