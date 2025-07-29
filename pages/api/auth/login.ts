// EPV Valuation Pro - User Login API
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
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Login user
    const result = await AuthService.login({
      email: email.toLowerCase().trim(),
      password,
    });

    if (!result.success) {
      return res.status(401).json({
        error: result.error,
      });
    }

    // Return success response
    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({
      error: 'Login failed',
    });
  }
}
