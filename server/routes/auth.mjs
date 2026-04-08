import express from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.mjs';
import { db } from '../config/database.mjs';
import { Role, normalizeRole } from '../rbac/permissions.mjs';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  role: z.enum([
    Role.BRAND_OPERATOR,
    Role.SALES,
    Role.OPERATIONS,
    Role.MANUFACTURER,
    Role.FINANCE,
    Role.DISTRIBUTOR,
    Role.RETAIL,
    Role.SALES_REP,
  ]),
  tenantId: z.string().uuid().optional(), // Optional: create new tenant if not provided
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { email, password, displayName, role, tenantId } = result.data;

    // Check if user already exists
    const existingUser = await db('users')
      .where({ email: email.toLowerCase() })
      .whereNull('deleted_at')
      .first();

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered',
      });
    }

    // Create or get tenant
    let userTenantId = tenantId;
    if (!userTenantId) {
      const [tenant] = await db('tenants')
        .insert({
          name: `${displayName}'s Organization`,
        })
        .returning('id');
      userTenantId = tenant.id;
    } else {
      // Verify tenant exists
      const tenant = await db('tenants').where({ id: tenantId }).first();
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const [user] = await db('users')
      .insert({
        tenant_id: userTenantId,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: normalizeRole(role),
        display_name: displayName,
        email_verified: false,
      })
      .returning(['id', 'email', 'role', 'tenant_id', 'display_name']);

    // Generate tokens
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = await authService.generateRefreshToken(user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Log event
    await authService.logAuthEvent({
      userId: user.id,
      eventType: 'registration',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        tenantId: user.tenant_id,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { email, password } = result.data;

    // Find user
    const user = await db('users')
      .where({
        email: email.toLowerCase(),
        is_active: true,
      })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if account is locked
    const isLocked = await authService.isAccountLocked(user.id);
    if (isLocked) {
      return res.status(403).json({
        error: 'Account temporarily locked due to failed login attempts',
        code: 'ACCOUNT_LOCKED',
        retryAfter: user.locked_until,
      });
    }

    // Verify password
    const validPassword = await authService.verifyPassword(
      user.password_hash,
      password
    );

    if (!validPassword) {
      await authService.recordFailedLogin(user.id);

      await authService.logAuthEvent({
        userId: user.id,
        eventType: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { reason: 'invalid_password' },
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Clear failed logins and update last login
    await authService.clearFailedLogins(user.id);

    // Generate tokens
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = await authService.generateRefreshToken(user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Log successful login
    await authService.logAuthEvent({
      userId: user.id,
      eventType: 'login_success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        tenantId: user.tenant_id,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const result = refreshSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { refreshToken } = result.data;

    // Verify refresh token
    const user = await authService.verifyRefreshToken(refreshToken);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'REFRESH_INVALID',
      });
    }

    // Revoke old refresh token
    await authService.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const accessToken = authService.generateAccessToken(user);
    const newRefreshToken = await authService.generateRefreshToken(user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    // If user is authenticated via access token, log the event
    if (req.user?.userId) {
      await authService.logAuthEvent({
        userId: req.user.userId,
        eventType: 'logout',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * POST /api/auth/password-reset-request
 * Request password reset email
 */
router.post('/password-reset-request', async (req, res) => {
  try {
    const result = passwordResetRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { email } = result.data;

    // Always return success to prevent email enumeration
    await authService.initiatePasswordReset(email);

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent',
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    // Still return success to prevent enumeration
    res.json({
      message: 'If an account exists with this email, a password reset link has been sent',
    });
  }
});

/**
 * POST /api/auth/password-reset
 * Complete password reset
 */
router.post('/password-reset', async (req, res) => {
  try {
    const result = passwordResetSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: result.error.errors,
      });
    }

    const { token, newPassword } = result.data;

    await authService.resetPassword(token, newPassword);

    res.json({
      message: 'Password has been reset successfully',
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(400).json({
      error: err.message || 'Password reset failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db('users')
      .where({ id: req.user.userId })
      .whereNull('deleted_at')
      .first(['id', 'email', 'role', 'display_name', 'tenant_id', 'last_login_at']);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
      tenantId: user.tenant_id,
      lastLoginAt: user.last_login_at,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
