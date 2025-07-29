// EPV Valuation Pro - Audit Logging Service
import { prisma } from '../database';
import { UserRole } from '../generated/prisma';

export interface AuditLogEntry {
  userId?: string;
  caseId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQuery {
  userId?: string;
  caseId?: string;
  entity?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<boolean> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          caseId: entry.caseId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          oldValues: entry.oldValues,
          newValues: entry.newValues,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          timestamp: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Audit log error:', error);
      return false;
    }
  }

  /**
   * Log user action
   */
  static async logUserAction(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entity,
      entityId,
      oldValues,
      newValues,
      metadata,
    });
  }

  /**
   * Log case-related action
   */
  static async logCaseAction(
    userId: string,
    caseId: string,
    action: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      caseId,
      action,
      entity: 'Case',
      entityId: caseId,
      oldValues,
      newValues,
      metadata,
    });
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    action: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entity: 'Security',
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        securityEvent: true,
        severity: this.getSecurityEventSeverity(action),
      },
    });
  }

  /**
   * Log system event
   */
  static async logSystemEvent(
    action: string,
    entity: string,
    entityId?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      action,
      entity,
      entityId,
      metadata: {
        ...metadata,
        systemEvent: true,
      },
    });
  }

  /**
   * Query audit logs
   */
  static async queryLogs(query: AuditQuery) {
    try {
      const where: any = {};

      // Build where clause
      if (query.userId) where.userId = query.userId;
      if (query.caseId) where.caseId = query.caseId;
      if (query.entity) where.entity = query.entity;
      if (query.action) where.action = query.action;

      if (query.dateFrom || query.dateTo) {
        where.timestamp = {};
        if (query.dateFrom) where.timestamp.gte = query.dateFrom;
        if (query.dateTo) where.timestamp.lte = query.dateTo;
      }

      const page = query.page || 1;
      const limit = query.limit || 50;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            case: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Query audit logs error:', error);
      throw new Error('Failed to query audit logs');
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId: string, days: number = 30) {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const [totalActions, actionBreakdown, entityBreakdown] =
        await Promise.all([
          // Total actions count
          prisma.auditLog.count({
            where: {
              userId,
              timestamp: { gte: dateFrom },
            },
          }),

          // Actions by type
          prisma.auditLog.groupBy({
            by: ['action'],
            where: {
              userId,
              timestamp: { gte: dateFrom },
            },
            _count: { action: true },
            orderBy: { _count: { action: 'desc' } },
          }),

          // Actions by entity
          prisma.auditLog.groupBy({
            by: ['entity'],
            where: {
              userId,
              timestamp: { gte: dateFrom },
            },
            _count: { entity: true },
            orderBy: { _count: { entity: 'desc' } },
          }),
        ]);

      return {
        period: `${days} days`,
        totalActions,
        actionBreakdown: actionBreakdown.map((item) => ({
          action: item.action,
          count: item._count.action,
        })),
        entityBreakdown: entityBreakdown.map((item) => ({
          entity: item.entity,
          count: item._count.entity,
        })),
      };
    } catch (error) {
      console.error('Get user activity summary error:', error);
      throw new Error('Failed to get user activity summary');
    }
  }

  /**
   * Get case activity timeline
   */
  static async getCaseActivityTimeline(caseId: string) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { caseId },
        orderBy: { timestamp: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        timestamp: log.timestamp,
        user: log.user,
        changes: {
          old: log.oldValues,
          new: log.newValues,
        },
        metadata: log.metadata,
      }));
    } catch (error) {
      console.error('Get case activity timeline error:', error);
      throw new Error('Failed to get case activity timeline');
    }
  }

  /**
   * Get security events
   */
  static async getSecurityEvents(days: number = 7) {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const events = await prisma.auditLog.findMany({
        where: {
          timestamp: { gte: dateFrom },
          OR: [
            { action: { contains: 'LOGIN' } },
            { action: { contains: 'LOGOUT' } },
            { action: { contains: 'REGISTER' } },
            { action: { contains: 'FAILED' } },
            { entity: 'Security' },
          ],
        },
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return events;
    } catch (error) {
      console.error('Get security events error:', error);
      throw new Error('Failed to get security events');
    }
  }

  /**
   * Clean up old audit logs
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
          // Keep security events longer
          NOT: {
            OR: [
              { entity: 'Security' },
              { action: { contains: 'LOGIN' } },
              { action: { contains: 'REGISTER' } },
            ],
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Cleanup old logs error:', error);
      return 0;
    }
  }

  /**
   * Export audit logs for compliance
   */
  static async exportLogs(query: AuditQuery) {
    try {
      const result = await this.queryLogs({ ...query, limit: 10000 });

      return result.logs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        user: log.user?.email || 'System',
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        changes: {
          before: log.oldValues,
          after: log.newValues,
        },
        metadata: log.metadata,
      }));
    } catch (error) {
      console.error('Export logs error:', error);
      throw new Error('Failed to export audit logs');
    }
  }

  /**
   * Get security event severity
   */
  private static getSecurityEventSeverity(action: string): string {
    const highSeverity = [
      'LOGIN_FAILED',
      'UNAUTHORIZED_ACCESS',
      'TOKEN_EXPIRED',
    ];
    const mediumSeverity = ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE'];

    if (highSeverity.some((a) => action.includes(a))) return 'HIGH';
    if (mediumSeverity.some((a) => action.includes(a))) return 'MEDIUM';
    return 'LOW';
  }
}

export default AuditService;
