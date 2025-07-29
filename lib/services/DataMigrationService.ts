// EPV Valuation Pro - Data Migration Service
// Handles migration from localStorage to PostgreSQL database

import { prisma } from '../database';
import { FinancialDatasetV1, AgentAnalysis, CaseData } from '../types';
import bcrypt from 'bcryptjs';

export interface MigrationResult {
  success: boolean;
  migratedCases: number;
  errors: string[];
  userId?: string;
}

export interface LocalStorageData {
  cases: CaseData[];
  state: any;
  preferences: any;
}

export class DataMigrationService {
  /**
   * Migrate all localStorage data to database for a user
   */
  async migrateLocalStorageData(
    email: string,
    name?: string,
    organization?: string
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedCases: 0,
      errors: [],
    };

    try {
      // 1. Create or find user
      const user = await this.createOrFindUser(email, name, organization);
      result.userId = user.id;

      // 2. Extract localStorage data (this would be called from client-side)
      const localData = this.extractLocalStorageData();

      if (!localData || !localData.cases || localData.cases.length === 0) {
        result.errors.push('No localStorage data found to migrate');
        return result;
      }

      // 3. Migrate cases with transaction
      const migratedCases = await prisma.$transaction(async (tx) => {
        const cases = [];

        for (const localCase of localData.cases) {
          try {
            const migratedCase = await this.migrateSingleCase(
              tx,
              user.id,
              localCase
            );
            cases.push(migratedCase);

            // Create audit log entry
            await tx.auditLog.create({
              data: {
                userId: user.id,
                caseId: migratedCase.id,
                action: 'MIGRATE',
                entity: 'Case',
                entityId: migratedCase.id,
                newValues: {
                  source: 'localStorage',
                  originalId: localCase.id,
                },
                metadata: {
                  migrationTimestamp: new Date(),
                  originalCaseCount: localData.cases.length,
                },
              },
            });
          } catch (error) {
            result.errors.push(
              `Failed to migrate case ${localCase.name}: ${(error as Error).message}`
            );
          }
        }

        return cases;
      });

      result.success = true;
      result.migratedCases = migratedCases.length;

      console.log(
        `✅ Successfully migrated ${result.migratedCases} cases for user ${email}`
      );
    } catch (error) {
      result.errors.push(`Migration failed: ${(error as Error).message}`);
      console.error('❌ Migration error:', error);
    }

    return result;
  }

  /**
   * Create or find user for migration
   */
  private async createOrFindUser(
    email: string,
    name?: string,
    organization?: string
  ) {
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user with temporary password (they'll need to set it up)
      const tempPassword = await bcrypt.hash('temp-password-change-me', 12);

      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Migrated User',
          organization: organization || 'Unknown',
          passwordHash: tempPassword,
          role: 'ANALYST',
        },
      });

      // Create audit log for user creation
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entity: 'User',
          entityId: user.id,
          newValues: {
            email,
            name,
            organization,
            source: 'migration',
          },
          metadata: {
            createdForMigration: true,
          },
        },
      });
    }

    return user;
  }

  /**
   * Migrate a single case from localStorage format to database
   */
  private async migrateSingleCase(
    tx: any,
    userId: string,
    localCase: CaseData
  ) {
    // Convert localStorage case to database format
    const dbCase = await tx.case.create({
      data: {
        name: localCase.name,
        status: this.mapCaseStatus(localCase.status),
        industry: this.extractIndustry(localCase.financialData),
        analysisType: 'EPV',
        financialData: this.sanitizeFinancialData(localCase.financialData),
        assumptions: this.extractAssumptions(localCase),
        userId,
        version: 1,
      },
    });

    // Migrate analyses if they exist
    if (localCase.analyses && localCase.analyses.length > 0) {
      for (const analysis of localCase.analyses) {
        await this.migrateAnalysis(tx, dbCase.id, analysis);
      }
    }

    return dbCase;
  }

  /**
   * Migrate analysis data
   */
  private async migrateAnalysis(
    tx: any,
    caseId: string,
    analysis: AgentAnalysis
  ) {
    await tx.analysis.create({
      data: {
        caseId,
        agentType: analysis.agentType,
        methodology: analysis.methodology || 'EPV Analysis',
        enterpriseValue: analysis.enterpriseValue.toString(),
        recommendation: this.mapRecommendation(analysis.recommendation),
        confidence: analysis.confidence,
        results: {
          originalAnalysis: analysis,
          migrationNote: 'Migrated from localStorage',
        },
        keyRisks: analysis.keyRisks || [],
        strengths: analysis.strengths || [],
        notes: analysis.notes,
        completedAt: analysis.completedAt || new Date(),
        processingTime: null,
      },
    });
  }

  /**
   * Extract localStorage data (this would be called from client-side)
   */
  private extractLocalStorageData(): LocalStorageData | null {
    if (typeof window === 'undefined') {
      return null; // Server-side, can't access localStorage
    }

    try {
      const casesData = localStorage.getItem('epv-cases');
      const stateData = localStorage.getItem('epv-pro-state');
      const preferencesData = localStorage.getItem('epv-preferences');

      return {
        cases: casesData ? JSON.parse(casesData) : [],
        state: stateData ? JSON.parse(stateData) : {},
        preferences: preferencesData ? JSON.parse(preferencesData) : {},
      };
    } catch (error) {
      console.error('Failed to extract localStorage data:', error);
      return null;
    }
  }

  /**
   * Utility functions for data transformation
   */
  private mapCaseStatus(
    status: string
  ): 'DRAFT' | 'ANALYZING' | 'REVIEW' | 'COMPLETE' | 'ARCHIVED' {
    const statusMap: Record<string, any> = {
      draft: 'DRAFT',
      analyzing: 'ANALYZING',
      complete: 'COMPLETE',
      review: 'REVIEW',
    };
    return statusMap[status] || 'DRAFT';
  }

  private mapRecommendation(
    rec: string
  ):
    | 'BUY'
    | 'HOLD'
    | 'SELL'
    | 'CONDITIONAL'
    | 'FAVORABLE'
    | 'CAUTION'
    | 'UNFAVORABLE' {
    const recMap: Record<string, any> = {
      BUY: 'BUY',
      HOLD: 'HOLD',
      SELL: 'SELL',
      CONDITIONAL: 'CONDITIONAL',
      FAVORABLE: 'FAVORABLE',
      CAUTION: 'CAUTION',
      UNFAVORABLE: 'UNFAVORABLE',
    };
    return recMap[rec] || 'HOLD';
  }

  private extractIndustry(financialData: FinancialDatasetV1): string {
    // Try to extract industry from financial data or default to Healthcare Services
    return (financialData as any).metadata?.industry || 'Healthcare Services';
  }

  private sanitizeFinancialData(data: FinancialDatasetV1): any {
    // Clean and prepare financial data for JSONB storage
    return {
      ...data,
      migrationTimestamp: new Date(),
      source: 'localStorage_migration',
    };
  }

  private extractAssumptions(localCase: CaseData): any {
    // Extract assumptions from case data
    return {
      discountRate: 12,
      growthRate: 3,
      terminalMultiple: 2.5,
      migrationNote: 'Default assumptions applied during migration',
    };
  }

  /**
   * Backup localStorage data before migration
   */
  async backupLocalStorageData(userId: string): Promise<boolean> {
    try {
      const localData = this.extractLocalStorageData();
      if (!localData) return false;

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BACKUP',
          entity: 'LocalStorage',
          entityId: 'localStorage-backup',
          oldValues: localData as any,
          metadata: {
            backupTimestamp: new Date(),
            purpose: 'pre-migration-backup',
          },
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to backup localStorage data:', error);
      return false;
    }
  }

  /**
   * Clear localStorage after successful migration
   */
  clearLocalStorageData(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const keysToRemove = ['epv-cases', 'epv-pro-state', 'epv-preferences'];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Set migration flag
      localStorage.setItem('epv-migrated', 'true');
      localStorage.setItem('epv-migration-date', new Date().toISOString());

      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Check if data has already been migrated
   */
  isDataMigrated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('epv-migrated') === 'true';
  }
}

export default DataMigrationService;
