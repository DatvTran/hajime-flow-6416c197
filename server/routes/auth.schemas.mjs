import { z } from 'zod';
import { Role } from '../rbac/permissions.mjs';

/**
 * Roles that can self-register (open registration).
 * FOUNDER_ADMIN and BRAND_OPERATOR must be created by an existing admin.
 */
const SELF_REGISTERABLE_ROLES = [
  Role.SALES,
  Role.OPERATIONS,
  Role.MANUFACTURER,
  Role.FINANCE,
  Role.DISTRIBUTOR,
  Role.RETAIL,
  Role.SALES_REP,
];

/**
 * Roles that can only be assigned by an existing FOUNDER_ADMIN or BRAND_OPERATOR.
 */
const ADMIN_ASSIGNABLE_ROLES = [
  Role.FOUNDER_ADMIN,
  Role.BRAND_OPERATOR,
  Role.SALES,
  Role.OPERATIONS,
  Role.MANUFACTURER,
  Role.FINANCE,
  Role.DISTRIBUTOR,
  Role.RETAIL,
  Role.SALES_REP,
];

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1),
    role: z.enum(SELF_REGISTERABLE_ROLES),
    inviteToken: z.string().optional(), // Required when joining an existing tenant
  })
  .strict();

// Admin-only user creation schema (all roles allowed)
export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  role: z.enum(ADMIN_ASSIGNABLE_ROLES),
  tenantId: z.string().uuid().optional(), // Defaults to admin's own tenant
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});
