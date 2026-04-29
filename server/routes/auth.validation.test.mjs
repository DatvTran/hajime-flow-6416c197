/** @vitest-environment node */

import { describe, it, expect } from 'vitest';
import { registerSchema } from './auth.schemas.mjs';
import { Role } from '../rbac/permissions.mjs';

const validPayload = {
  email: 'tester@example.com',
  password: 'password123',
  displayName: 'Tester',
  role: Role.SALES,
};

describe('registerSchema request validation', () => {
  it('accepts payload when tenantId is absent', () => {
    const result = registerSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  it('rejects payload when tenantId is present', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      tenantId: 'ec37f4f7-fdf1-4f2f-bfbd-5eafb973a9cb',
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0]?.code).toBe('unrecognized_keys');
    expect(result.error.issues[0]?.keys).toContain('tenantId');
  });
});
