// EPV Valuation Pro - User Registration API
import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../lib/services/AuthService';
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

    const { email, password, name, organization } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error:
          'Missing required fields: email, password, and name are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
      });
    }

    // Register user
    const result = await AuthService.register({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      organization: organization?.trim(),
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
      });
    }

    // Return success response
    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error('Registration API error:', error);
    res.status(500).json({
      error: 'Registration failed',
    });
  }
}
