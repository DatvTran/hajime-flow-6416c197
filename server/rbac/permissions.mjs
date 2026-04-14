/**
 * Role-Based Access Control (RBAC) System
 * Defines roles and permissions for Hajime B2B Supply Chain OS
 */

export const Role = {
  FOUNDER_ADMIN: 'founder_admin',
  BRAND_OPERATOR: 'brand_operator',
  SALES: 'sales',
  OPERATIONS: 'operations',
  MANUFACTURER: 'manufacturer',
  FINANCE: 'finance',
  DISTRIBUTOR: 'distributor',
  RETAIL: 'retail',
  SALES_REP: 'sales_rep',
};

export const Permission = {
  // Users
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',

  // Accounts (customers/retailers)
  ACCOUNTS_READ: 'accounts:read',
  ACCOUNTS_WRITE: 'accounts:write',
  ACCOUNTS_DELETE: 'accounts:delete',

  // Orders
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  ORDERS_APPROVE: 'orders:approve',
  ORDERS_DELETE: 'orders:delete',

  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  INVENTORY_ADJUST: 'inventory:adjust',

  // Purchase Orders
  PO_READ: 'po:read',
  PO_WRITE: 'po:write',
  PO_APPROVE: 'po:approve',

  // Production
  PRODUCTION_READ: 'production:read',
  PRODUCTION_WRITE: 'production:write',

  // Shipments
  SHIPMENTS_READ: 'shipments:read',
  SHIPMENTS_WRITE: 'shipments:write',

  // Financials
  FINANCIALS_READ: 'financials:read',
  FINANCIALS_WRITE: 'financials:write',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // Reports
  REPORTS_READ: 'reports:read',

  // Forecasts
  FORECASTS_READ: 'forecasts:read',
  FORECASTS_WRITE: 'forecasts:write',

  // CSV Import/Export
  CSV_EXPORT: 'csv:export',
  CSV_IMPORT: 'csv:import',
};

/**
 * Role-to-Permissions mapping
 * Wildcard (*) grants all permissions in a category
 */
export const ROLE_PERMISSIONS = {
  [Role.FOUNDER_ADMIN]: [
    '*', // All permissions
  ],

  [Role.BRAND_OPERATOR]: [
    'users:*',
    'accounts:*',
    'orders:*',
    'inventory:*',
    'po:*',
    'production:*',
    'shipments:*',
    'financials:*',
    'settings:*',
    'reports:*',
    'forecasts:*',
    'csv:*',
  ],

  [Role.SALES]: [
    Permission.ACCOUNTS_READ,
    Permission.ACCOUNTS_WRITE,
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.INVENTORY_READ,
    Permission.FORECASTS_READ,
    Permission.SHIPMENTS_READ,
  ],

  [Role.SALES_REP]: [
    Permission.ACCOUNTS_READ,
    Permission.ACCOUNTS_WRITE,
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.INVENTORY_READ,
    Permission.FORECASTS_READ,
    Permission.SHIPMENTS_READ,
  ],

  [Role.OPERATIONS]: [
    Permission.INVENTORY_READ,
    Permission.INVENTORY_WRITE,
    Permission.INVENTORY_ADJUST,
    Permission.ORDERS_READ,
    Permission.PO_READ,
    Permission.PO_WRITE,
    Permission.PRODUCTION_READ,
    Permission.PRODUCTION_WRITE,
    Permission.SHIPMENTS_READ,
    Permission.SHIPMENTS_WRITE,
    Permission.CSV_EXPORT,
    Permission.CSV_IMPORT,
  ],

  [Role.MANUFACTURER]: [
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.PO_READ,
    Permission.PRODUCTION_READ,
    Permission.PRODUCTION_WRITE,
    Permission.SHIPMENTS_READ,
    Permission.INVENTORY_READ,
  ],

  [Role.DISTRIBUTOR]: [
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_WRITE,
    Permission.INVENTORY_ADJUST,
    Permission.SHIPMENTS_READ,
    Permission.SHIPMENTS_WRITE,
    Permission.ACCOUNTS_READ,
  ],

  [Role.FINANCE]: [
    Permission.ACCOUNTS_READ,
    Permission.ORDERS_READ,
    Permission.PO_READ,
    Permission.FINANCIALS_READ,
    Permission.REPORTS_READ,
  ],

  [Role.RETAIL]: [
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.SHIPMENTS_READ,
    Permission.INVENTORY_READ,
  ],
};

/**
 * Check if a role has a specific permission
 * Supports wildcards (e.g., 'users:*' matches 'users:read')
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;

  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  // Full wildcard
  if (permissions.includes('*')) return true;

  // Direct permission match
  if (permissions.includes(permission)) return true;

  // Wildcard category match (e.g., 'users:*' matches 'users:read')
  const category = permission.split(':')[0];
  if (permissions.includes(`${category}:*`)) return true;

  return false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role, permissions) {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role, permissions) {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Map legacy/client roles to server roles
 */
export function normalizeRole(clientRole) {
  const roleMap = {
    'brand_operator': Role.BRAND_OPERATOR,
    'founder': Role.BRAND_OPERATOR,
    'founder_admin': Role.FOUNDER_ADMIN,
    'manufacturer': Role.MANUFACTURER,
    'distributor': Role.DISTRIBUTOR,
    'retail': Role.RETAIL,
    'retail_account': Role.RETAIL,
    'sales': Role.SALES,
    'sales_rep': Role.SALES_REP,
    'operations': Role.OPERATIONS,
    'finance': Role.FINANCE,
  };

  return roleMap[clientRole] || clientRole;
}
