const pool = require('./pgClient');
const { connectMongo, getMongoDb } = require('./mongoClient');

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        subscription_tier VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        phone VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        warehouse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(500),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        capacity INTEGER DEFAULT 0,
        used_capacity INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        sku VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 0,
        reserved_quantity INTEGER DEFAULT 0,
        unit_price DECIMAL(12, 2),
        reorder_point INTEGER DEFAULT 0,
        category VARCHAR(100),
        weight DECIMAL(10, 2),
        dimensions VARCHAR(100),
        status VARCHAR(50) DEFAULT 'in_stock',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(warehouse_id, sku)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_events (
        event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID REFERENCES inventory_items(item_id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        quantity_change INTEGER,
        notes TEXT,
        user_id UUID REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        customer_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        shipping_address TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'normal',
        total_amount DECIMAL(12, 2),
        notes TEXT,
        warehouse_id UUID REFERENCES warehouses(warehouse_id),
        assigned_to UUID REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
        item_id UUID REFERENCES inventory_items(item_id),
        sku VARCHAR(100),
        name VARCHAR(255),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(12, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        carrier VARCHAR(100),
        tracking_number VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        origin_address TEXT,
        destination_address TEXT,
        eta TIMESTAMP,
        actual_delivery TIMESTAMP,
        weight DECIMAL(10, 2),
        shipping_cost DECIMAL(12, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS routes (
        route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        vehicle_id VARCHAR(100),
        driver_id UUID REFERENCES users(user_id),
        driver_name VARCHAR(255),
        stops JSONB DEFAULT '[]',
        total_distance DECIMAL(10, 2),
        estimated_duration INTEGER,
        eta TIMESTAMP,
        status VARCHAR(50) DEFAULT 'planned',
        route_optimized BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        capacity DECIMAL(10, 2),
        license_plate VARCHAR(100),
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS forecast_models (
        model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        params JSONB,
        accuracy_score DECIMAL(5, 4),
        last_trained_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS forecast_data (
        forecast_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        item_id UUID REFERENCES inventory_items(item_id) ON DELETE CASCADE,
        forecast_value DECIMAL(12, 2),
        confidence_lower DECIMAL(12, 2),
        confidence_upper DECIMAL(12, 2),
        forecast_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_rules (
        rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger_type VARCHAR(100) NOT NULL,
        trigger_conditions JSONB,
        actions JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        priority INTEGER DEFAULT 0,
        created_by UUID REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(user_id),
        type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(user_id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        name VARCHAR(255),
        config JSONB,
        status VARCHAR(50) DEFAULT 'connected',
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('All tables created successfully');
  } finally {
    client.release();
  }
}

module.exports = { createTables };
