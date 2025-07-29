// EPV Valuation Pro - Authentication Service
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../database';
import { User, UserRole } from '../generated/prisma';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organization?: string;
}

export interface AuthResult {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  token?: string;
  error?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly SALT_ROUNDS = 12;

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          organization: data.organization,
          passwordHash,
          role: 'ANALYST', // Default role
          isActive: true,
        },
      });

      // Generate token
      const token = this.generateToken(user);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          entity: 'User',
          entityId: user.id,
          newValues: {
            email: data.email,
            name: data.name,
            organization: data.organization,
            role: 'ANALYST',
          },
          metadata: {
            source: 'auth_service',
            registrationMethod: 'email_password',
          },
        },
      });

      // Remove password hash from response
      const { passwordHash: userPasswordHash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
      };
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated',
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        // Log failed login attempt
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN_FAILED',
            entity: 'User',
            entityId: user.id,
            metadata: {
              reason: 'invalid_password',
              timestamp: new Date(),
            },
          },
        });

        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Generate token
      const token = this.generateToken(user);

      // Create session record
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Log successful login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          metadata: {
            source: 'auth_service',
            loginMethod: 'email_password',
          },
        },
      });

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(token: string): Promise<boolean> {
    try {
      // Remove session from database
      await prisma.userSession.delete({
        where: { token },
      });

      // Extract user ID from token for audit log
      const decoded = jwt.decode(token) as TokenPayload;
      if (decoded?.userId) {
        await prisma.auditLog.create({
          data: {
            userId: decoded.userId,
            action: 'LOGOUT',
            entity: 'User',
            entityId: decoded.userId,
            metadata: {
              source: 'auth_service',
              logoutMethod: 'explicit',
            },
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Verify token and return user
   */
  static async verifyToken(token: string): Promise<User | null> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;

      // Check if session exists in database
      const session = await prisma.userSession.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Check if user is still active
      if (!session.user.isActive) {
        return null;
      }

      return session.user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'epv-valuation-pro',
      audience: 'epv-users',
    } as jwt.SignOptions);
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate password reset token
   */
  static generateResetToken(): string {
    return jwt.sign(
      { type: 'password_reset', timestamp: Date.now() },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
  }
}

export default AuthService;
