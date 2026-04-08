import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/database.mjs';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

export class AuthService {
  /**
   * Hash password using Argon2id (OWASP recommended)
   */
  async hashPassword(password) {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(hash, password) {
    return argon2.verify(hash, password);
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  /**
   * Generate refresh token and store hash in database
   */
  async generateRefreshToken(userId, deviceInfo = {}) {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db('refresh_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      device_info: JSON.stringify(deviceInfo),
      expires_at: db.raw(`NOW() + INTERVAL '${REFRESH_TOKEN_EXPIRY_DAYS} days'`),
    });

    return token;
  }

  /**
   * Verify refresh token and return user if valid
   */
  async verifyRefreshToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const refreshToken = await db('refresh_tokens')
      .where({
        token_hash: tokenHash,
        revoked: false,
      })
      .whereRaw('expires_at > NOW()')
      .first();

    if (!refreshToken) {
      return null;
    }

    const user = await db('users')
      .where({ id: refreshToken.user_id, is_active: true })
      .whereNull('deleted_at')
      .first();

    return user;
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .update({ revoked: true });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId) {
    await db('refresh_tokens')
      .where({ user_id: userId })
      .update({ revoked: true });
  }

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(email) {
    const user = await db('users')
      .where({ email: email.toLowerCase() })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await db('password_resets').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: db.raw(`NOW() + INTERVAL '${PASSWORD_RESET_EXPIRY_HOURS} hour'`),
    });

    // Return raw token for email service
    return resetToken;
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const reset = await db('password_resets')
      .where({
        token_hash: tokenHash,
        used: false,
      })
      .whereRaw('expires_at > NOW()')
      .first();

    return reset || null;
  }

  /**
   * Complete password reset
   */
  async resetPassword(token, newPassword) {
    const reset = await this.verifyPasswordResetToken(token);
    if (!reset) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await db.transaction(async (trx) => {
      await trx('users')
        .where({ id: reset.user_id })
        .update({
          password_hash: passwordHash,
          updated_at: trx.fn.now(),
        });

      await trx('password_resets')
        .where({ id: reset.id })
        .update({ used: true });

      // Revoke all existing sessions for security
      await trx('refresh_tokens')
        .where({ user_id: reset.user_id })
        .update({ revoked: true });
    });
  }

  /**
   * Verify JWT access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      return null;
    }
  }

  /**
   * Log authentication event
   */
  async logAuthEvent({ userId, eventType, ipAddress, userAgent, metadata = {} }) {
    try {
      await db('auth_events').insert({
        user_id: userId,
        event_type: eventType,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: JSON.stringify(metadata),
      });
    } catch (err) {
      // Don't fail auth for logging errors
      console.error('Auth event logging failed:', err);
    }
  }

  /**
   * Handle failed login attempt
   */
  async recordFailedLogin(userId) {
    await db('users')
      .where({ id: userId })
      .increment('failed_login_attempts', 1);

    const user = await db('users').where({ id: userId }).first();

    // Lock account after 5 failed attempts
    if (user.failed_login_attempts >= 5) {
      await db('users')
        .where({ id: userId })
        .update({
          locked_until: db.raw('NOW() + INTERVAL \'30 minutes\''),
        });
    }
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId) {
    const user = await db('users')
      .where({ id: userId })
      .whereRaw('locked_until > NOW()')
      .first();

    return Boolean(user);
  }

  /**
   * Clear failed login attempts on successful login
   */
  async clearFailedLogins(userId) {
    await db('users')
      .where({ id: userId })
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: db.fn.now(),
      });
  }
}

export const authService = new AuthService();
