// EPV Valuation Pro - User Logout API
import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../lib/services/AuthService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        error: 'Authorization header missing or invalid format',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Logout user
    const success = await AuthService.logout(token);

    if (!success) {
      return res.status(400).json({
        error: 'Logout failed',
      });
    }

    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout API error:', error);
    res.status(500).json({
      error: 'Logout failed',
    });
  }
}
