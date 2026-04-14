const pool = require('./pgClient');
const bcrypt = require('bcryptjs');

async function seedData() {
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create demo organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name, industry, subscription_tier) 
       VALUES ($1, $2, $3) 
       ON CONFLICT DO NOTHING 
       RETURNING org_id`,
      ['Demo Logistics Co', 'logistics', 'enterprise']
    );

    let orgId;
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].org_id;
    } else {
      const existing = await client.query('SELECT org_id FROM organizations WHERE name = $1', ['Demo Logistics Co']);
      orgId = existing.rows[0].org_id;
    }

    // Create admin user
    await client.query(
      `INSERT INTO users (org_id, email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING`,
      [orgId, 'admin@logiware.com', hashedPassword, 'Admin User', 'admin']
    );

    // Create warehouse manager
    await client.query(
      `INSERT INTO users (org_id, email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING`,
      [orgId, 'manager@logiware.com', hashedPassword, 'Warehouse Manager', 'manager']
    );

    // Create warehouse
    const whResult = await client.query(
      `INSERT INTO warehouses (org_id, name, location, latitude, longitude, capacity, used_capacity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT DO NOTHING 
       RETURNING warehouse_id`,
      [orgId, 'Main Warehouse', '123 Logistics Blvd, Dallas TX', 32.7767, -96.7970, 10000, 3500]
    );

    let warehouseId;
    if (whResult.rows.length > 0) {
      warehouseId = whResult.rows[0].warehouse_id;
    } else {
      const existing = await client.query('SELECT warehouse_id FROM warehouses WHERE name = $1', ['Main Warehouse']);
      warehouseId = existing.rows[0].warehouse_id;
    }

    // Create sample inventory items
    const items = [
      { sku: 'WH-001', name: 'Widget Alpha', qty: 500, reorder: 100, price: 12.99, cat: 'Components' },
      { sku: 'WH-002', name: 'Widget Beta', qty: 350, reorder: 75, price: 24.99, cat: 'Components' },
      { sku: 'WH-003', name: 'Gadget Pro', qty: 120, reorder: 50, price: 89.99, cat: 'Electronics' },
      { sku: 'WH-004', name: 'Sensor Kit', qty: 45, reorder: 30, price: 149.99, cat: 'Electronics' },
      { sku: 'WH-005', name: 'Packing Box L', qty: 2000, reorder: 500, price: 2.49, cat: 'Packaging' },
      { sku: 'WH-006', name: 'Packing Box M', qty: 1800, reorder: 400, price: 1.99, cat: 'Packaging' },
      { sku: 'WH-007', name: 'Bubble Wrap Roll', qty: 300, reorder: 100, price: 15.99, cat: 'Packaging' },
      { sku: 'WH-008', name: 'Shipping Label 4x6', qty: 5000, reorder: 1000, price: 0.05, cat: 'Packaging' },
    ];

    for (const item of items) {
      await client.query(
        `INSERT INTO inventory_items (warehouse_id, org_id, sku, name, description, quantity, reserved_quantity, unit_price, reorder_point, category, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         ON CONFLICT (warehouse_id, sku) DO NOTHING`,
        [warehouseId, orgId, item.sku, item.name, `Premium ${item.name}`, item.qty, 0, item.price, item.reorder, item.cat, item.qty > item.reorder ? 'in_stock' : 'low_stock']
      );
    }

    // Create sample orders
    const orderResult = await client.query(
      `INSERT INTO orders (org_id, customer_id, customer_name, customer_email, shipping_address, status, priority, total_amount, warehouse_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING order_id`,
      [orgId, 'CUST-001', 'John Smith', 'john@customer.com', '456 Delivery St, Austin TX 78701', 'pending', 'high', 299.97, warehouseId]
    );

    console.log('Seed data created successfully');
    console.log(`Org ID: ${orgId}`);
    console.log(`Warehouse ID: ${warehouseId}`);
    console.log('Login with: admin@logiware.com / admin123');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
  }
}

seedData();
