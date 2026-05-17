/**
 * Seed: Initial data for Hajime development
 * Creates a default tenant, admin user, and sample products
 */
import { authService } from '../services/auth.mjs';
import { normalizeIncentiveManagerState } from '../lib/incentive-manager-state.mjs';

export async function seed(knex) {
  console.log('[seed] Starting database seed...');

  // Clean existing data (except migrations)
  await knex('audit_logs').del();
  await knex('sales_order_items').del();
  await knex('sales_orders').del();
  await knex('purchase_order_items').del();
  await knex('purchase_orders').del();
  await knex('shipments').del();
  await knex('production_runs').del();
  await knex('inventory_adjustments').del();
  await knex('inventory').del();
  await knex('accounts').del();
  await knex('products').del();
  await knex('auth_events').del();
  await knex('refresh_tokens').del();
  await knex('password_resets').del();
  await knex('users').del();
  if (await knex.schema.hasTable('supply_chain_incentive_state')) {
    await knex('supply_chain_incentive_state').del();
  }
  await knex('tenants').del();

  // Create default tenant
  const [tenant] = await knex('tenants')
    .insert({
      name: 'Hajime Inc.',
      subdomain: 'hajime',
      settings: JSON.stringify({
        currency: 'CAD',
        timezone: 'America/Toronto',
        defaultPaymentTerms: 'Net 30',
      }),
    })
    .returning('id');

  const tenantId = tenant.id;
  console.log(`[seed] Created tenant: ${tenantId}`);

  // Create admin user
  const passwordHash = await authService.hashPassword('admin123!');
  const [adminUser] = await knex('users')
    .insert({
      tenant_id: tenantId,
      email: 'admin@hajime.jp',
      password_hash: passwordHash,
      role: 'founder_admin',
      display_name: 'Hajime Admin',
      is_active: true,
      email_verified: true,
    })
    .returning('id');

  console.log(`[seed] Created admin user: ${adminUser.id}`);

  // Create demo retail user
  const retailPasswordHash = await authService.hashPassword('retail123!');
  const [retailUser] = await knex('users')
    .insert({
      tenant_id: tenantId,
      email: 'retail@hajime.jp',
      password_hash: retailPasswordHash,
      role: 'retail',
      display_name: 'Demo Retailer',
      is_active: true,
      email_verified: true,
    })
    .returning('id');

  console.log(`[seed] Created retail user: ${retailUser.id}`);

  const salesRepPasswordHash = await authService.hashPassword('admin123!');
  const salesRepUsers = [
    { email: 'marcus.chen@hajime.jp', display_name: 'Marcus Chen' },
    { email: 'sarah.kim@hajime.jp', display_name: 'Sarah Kim' },
    { email: 'luca.moretti@hajime.jp', display_name: 'Luca Moretti' },
    { email: 'jordan.lee@hajime.jp', display_name: 'Jordan Lee' },
  ];
  for (const r of salesRepUsers) {
    await knex('users').insert({
      tenant_id: tenantId,
      email: r.email,
      password_hash: salesRepPasswordHash,
      role: 'sales_rep',
      display_name: r.display_name,
      is_active: true,
      email_verified: true,
    });
    console.log(`[seed] Created sales rep user: ${r.email}`);
  }

  const rosterRetailUsers = [
    { email: 'jeff@thedrake.ca', display_name: 'Jeff Guignard' },
    { email: 'mrossi@eataly.com', display_name: 'Maria Rossi' },
    { email: 'jpark@lcbo.com', display_name: 'James Park' },
  ];
  for (const r of rosterRetailUsers) {
    await knex('users').insert({
      tenant_id: tenantId,
      email: r.email,
      password_hash: retailPasswordHash,
      role: 'retail',
      display_name: r.display_name,
      is_active: true,
      email_verified: true,
    });
    console.log(`[seed] Created retail user: ${r.email}`);
  }

  // Create sample products (Hajime Coffee Rhum)
  const products = await knex('products')
    .insert([
      {
        tenant_id: tenantId,
        sku: 'HAJIME-750',
        name: 'Hajime First Press Coffee Rhum 750ml',
        description: '25% ABV cold-press coffee rhum liqueur',
        category: 'Spirits',
        unit_size: '750ml',
        metadata: JSON.stringify({
          abv: '25%',
          origin: 'Canada',
          type: 'Coffee Rhum',
        }),
      },
      {
        tenant_id: tenantId,
        sku: 'HAJIME-375',
        name: 'Hajime First Press Coffee Rhum 375ml',
        description: '25% ABV cold-press coffee rhum liqueur (half bottle)',
        category: 'Spirits',
        unit_size: '375ml',
        metadata: JSON.stringify({
          abv: '25%',
          origin: 'Canada',
          type: 'Coffee Rhum',
        }),
      },
      {
        tenant_id: tenantId,
        sku: 'HAJIME-GIFT',
        name: 'Hajime Gift Box Set',
        description: '750ml bottle with two signature glasses',
        category: 'Gift Sets',
        unit_size: 'Set',
        metadata: JSON.stringify({
          abv: '25%',
          origin: 'Canada',
          type: 'Gift Set',
        }),
      },
    ])
    .returning('id');

  console.log(`[seed] Created ${products.length} products`);

  // Create inventory for products
  await knex('inventory').insert([
    {
      tenant_id: tenantId,
      product_id: products[0].id,
      location: 'Main Warehouse',
      quantity_on_hand: 5208,
      reserved_quantity: 150,
      reorder_point: 1000,
      reorder_quantity: 2000,
    },
    {
      tenant_id: tenantId,
      product_id: products[1].id,
      location: 'Main Warehouse',
      quantity_on_hand: 3500,
      reserved_quantity: 100,
      reorder_point: 500,
      reorder_quantity: 1500,
    },
    {
      tenant_id: tenantId,
      product_id: products[2].id,
      location: 'Main Warehouse',
      quantity_on_hand: 500,
      reserved_quantity: 50,
      reorder_point: 100,
      reorder_quantity: 300,
    },
  ]);

  console.log('[seed] Created inventory records');

  // Create sample accounts
  const accounts = await knex('accounts')
    .insert([
      {
        tenant_id: tenantId,
        account_number: 'ACC-001',
        name: 'The Drake Hotel',
        type: 'Hotel',
        market: 'Toronto',
        status: 'active',
        sales_owner: 'Marcus Chen',
        email: 'orders@drakehotel.ca',
        phone: '416-531-5042',
        billing_address: JSON.stringify({
          street: '1150 Queen St W',
          city: 'Toronto',
          province: 'ON',
          postal: 'M6J 1J3',
        }),
        payment_terms: 'Net 30',
        credit_limit: 10000.00,
        sales_owner: 'Marcus Chen',
      },
      {
        tenant_id: tenantId,
        account_number: 'ACC-002',
        name: 'Bar Isabel',
        type: 'Restaurant',
        market: 'Toronto',
        status: 'active',
        sales_owner: 'Marcus Chen',
        email: 'orders@barisabel.com',
        phone: '416-532-2222',
        billing_address: JSON.stringify({
          street: '797 College St',
          city: 'Toronto',
          province: 'ON',
          postal: 'M6G 1C7',
        }),
        payment_terms: 'Net 15',
        credit_limit: 5000.00,
        sales_owner: 'Sarah Kim',
      },
      {
        tenant_id: tenantId,
        account_number: 'ACC-003',
        name: 'Paradise Grapevine',
        type: 'Retail',
        market: 'Toronto',
        status: 'active',
        sales_owner: 'Jordan Lee',
        email: 'orders@paradisegrapevine.com',
        phone: '416-519-6842',
        billing_address: JSON.stringify({
          street: '841 Bloor St W',
          city: 'Toronto',
          province: 'ON',
          postal: 'M6G 1M3',
        }),
        payment_terms: 'Net 7',
        credit_limit: 2500.00,
      },
    ])
    .returning('id');

  console.log(`[seed] Created ${accounts.length} accounts`);

  // Create a sample sales order
  const [order] = await knex('sales_orders')
    .insert({
      tenant_id: tenantId,
      order_number: 'SO-2025-001',
      account_id: accounts[0].id,
      status: 'confirmed',
      order_date: '2025-03-15',
      requested_delivery_date: '2025-03-22',
      subtotal: 450.00,
      tax_amount: 58.50,
      shipping_cost: 25.00,
      total_amount: 533.50,
      shipping_address: JSON.stringify({
        street: '1150 Queen St W',
        city: 'Toronto',
        province: 'ON',
        postal: 'M6J 1J3',
      }),
      created_by: adminUser.id,
    })
    .returning('id');

  await knex('sales_order_items').insert([
    {
      tenant_id: tenantId,
      sales_order_id: order.id,
      product_id: products[0].id,
      sku: 'HAJIME-750',
      product_name: 'Hajime First Press Coffee Rhum 750ml',
      quantity_ordered: 10,
      unit_price: 45.00,
    },
  ]);

  console.log('[seed] Created sample sales order');

  // Create sample purchase order
  await knex('purchase_orders').insert({
    tenant_id: tenantId,
    po_number: 'PO-2025-001',
    supplier_name: 'Hajime Distillery',
    status: 'approved',
    order_date: '2025-03-01',
    expected_delivery_date: '2025-03-30',
    subtotal: 25000.00,
    total_amount: 28250.00,
    notes: 'Q2 production batch',
    created_by: adminUser.id,
  });

  console.log('[seed] Created sample purchase order');

  if (await knex.schema.hasTable('supply_chain_incentive_state')) {
    const incentiveState = normalizeIncentiveManagerState({
      partners: [
        {
          id: '1',
          name: 'Convoy Supply Ontario',
          market: 'Ontario',
          tier: 'Growth',
          quarterlyCasesSold: 420,
          accountsOpened: 12,
          reorders: 85,
          tastingsCompleted: 18,
          adfSpend: 2500,
          quarterlyPerformanceTier: 'Silver',
        },
        {
          id: '2',
          name: 'Liberty Wine Merchants',
          market: 'British Columbia',
          tier: 'Premier',
          quarterlyCasesSold: 680,
          accountsOpened: 22,
          reorders: 145,
          tastingsCompleted: 28,
          adfSpend: 4200,
          quarterlyPerformanceTier: 'Gold',
        },
        {
          id: '3',
          name: 'Saq Distributions',
          market: 'Quebec',
          tier: 'Foundation',
          quarterlyCasesSold: 180,
          accountsOpened: 6,
          reorders: 32,
          tastingsCompleted: 8,
          adfSpend: 1200,
          quarterlyPerformanceTier: 'Bronze',
        },
      ],
      spifs: [
        {
          id: 's1',
          partnerId: '1',
          partnerName: 'Convoy Supply Ontario',
          repName: 'Sarah Mitchell',
          type: 'new_on_premise',
          date: '2026-04-05',
          quantity: 2,
          payout: 300,
          notes: 'The Drake Hotel - new cocktail menu',
        },
      ],
    });
    await knex('supply_chain_incentive_state').insert({
      tenant_id: tenantId,
      state: JSON.stringify(incentiveState),
      updated_at: new Date(),
      updated_by: adminUser.id,
    });
    console.log('[seed] Created supply chain incentive state');
  }

  console.log('[seed] Database seed completed successfully!');
  console.log('[seed] Login credentials:');
  console.log('  Admin:    admin@hajime.jp / admin123!');
  console.log('  Retail:   retail@hajime.jp / retail123! (plus roster emails Jeff · Maria · James)');
}
