// EPV Valuation Pro - Data Migration API
import { NextApiRequest, NextApiResponse } from 'next';
import { DataMigrationService } from '../../../lib/services/DataMigrationService';
import { initializeDatabase } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database is initialized
    await initializeDatabase();

    const { email, name, organization, localStorageData } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        error: 'Email is required for migration',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Create migration service instance
    const migrationService = new DataMigrationService();

    // Perform migration
    const result = await migrationService.migrateLocalStorageData(
      email.toLowerCase().trim(),
      name?.trim(),
      organization?.trim()
    );

    if (!result.success) {
      return res.status(400).json({
        error: 'Migration failed',
        details: result.errors,
      });
    }

    res.status(200).json({
      message: 'Data migration completed successfully',
      migratedCases: result.migratedCases,
      userId: result.userId,
      warnings: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Migration API error:', error);
    res.status(500).json({
      error: 'Migration failed due to server error',
    });
  }
}
