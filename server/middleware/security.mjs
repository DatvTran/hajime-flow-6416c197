import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';

/**
 * Security middleware configuration
 */
export function setupSecurityMiddleware(app) {
  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", 'https://api.stripe.com'],
          scriptSrc: ["'self'", 'https://js.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Stripe integration
    })
  );

  // CORS configuration
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        const o = origin.replace(/\/$/, '');
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return cb(null, true);
        if (ALLOWED_ORIGINS.includes(o)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    })
  );

  // Request logging
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

/**
 * Rate limiting configurations
 */
export const rateLimiters = {
  // General API rate limit
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 600,
    message: {
      error: 'Too many requests from this IP',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Auth endpoints stricter limit
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 auth attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
    message: {
      error: 'Too many authentication attempts',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Password reset limit
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
    message: {
      error: 'Too many password reset requests',
      code: 'RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600,
    },
  }),

  // CSV export limit (resource intensive)
  csvExport: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 exports per 5 minutes
    message: {
      error: 'Too many export requests',
      code: 'EXPORT_RATE_LIMIT_EXCEEDED',
      retryAfter: 300,
    },
  }),
};
