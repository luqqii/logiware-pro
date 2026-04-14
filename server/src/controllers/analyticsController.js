const pool = require('../database/pgClient');

exports.getDashboard = async (req, res) => {
  try {
    const orgId = req.user.orgId;

    // Total inventory value
    const inventoryValue = await pool.query(
      'SELECT COALESCE(SUM(quantity * unit_price), 0) as total_value, COUNT(*) as total_items FROM inventory_items WHERE org_id = $1',
      [orgId]
    );

    // Orders summary
    const ordersSummary = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'picked') as picked_orders,
        COUNT(*) FILTER (WHERE status = 'packed') as packed_orders,
        COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders
       FROM orders WHERE org_id = $1`,
      [orgId]
    );

    // Shipments summary
    const shipmentsSummary = await pool.query(
      `SELECT 
        COUNT(*) as total_shipments,
        COUNT(*) FILTER (WHERE status = 'in_transit') as in_transit,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered
       FROM shipments WHERE org_id = $1`,
      [orgId]
    );

    // Low stock alerts
    const lowStock = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_items WHERE org_id = $1 AND quantity <= reorder_point',
      [orgId]
    );

    // Warehouse capacity
    const warehouseCapacity = await pool.query(
      'SELECT COALESCE(SUM(capacity), 0) as total_capacity, COALESCE(SUM(used_capacity), 0) as used_capacity FROM warehouses WHERE org_id = $1',
      [orgId]
    );

    // Recent alerts
    const recentAlerts = await pool.query(
      'SELECT * FROM alerts WHERE org_id = $1 AND is_read = false ORDER BY created_at DESC LIMIT 10',
      [orgId]
    );

    // Order fulfillment rate (last 7 days)
    const fulfillmentRate = await pool.query(
      `SELECT 
        ROUND(COALESCE(COUNT(*) FILTER (WHERE status IN ('shipped', 'delivered'))::numeric / NULLIF(COUNT(*), 0) * 100, 0), 1) as rate
       FROM orders WHERE org_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
      [orgId]
    );

    // Average fulfillment lead time (hours)
    const leadTime = await pool.query(
      `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 1) as avg_hours
       FROM orders WHERE org_id = $1 AND status IN ('shipped', 'delivered') AND created_at >= NOW() - INTERVAL '30 days'`,
      [orgId]
    );

    res.json({
      inventory: inventoryValue.rows[0],
      orders: ordersSummary.rows[0],
      shipments: shipmentsSummary.rows[0],
      lowStockAlerts: lowStock.rows[0].count,
      warehouseCapacity: warehouseCapacity.rows[0],
      recentAlerts: recentAlerts.rows,
      fulfillmentRate: fulfillmentRate.rows[0].rate || 0,
      avgLeadTime: leadTime.rows[0].avg_hours || 0,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

exports.getInventoryTrends = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DATE(created_at) as date, 
       COUNT(*) as items_added,
       SUM(quantity) as total_quantity
       FROM inventory_items WHERE org_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`,
      [req.user.orgId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory trends' });
  }
};

exports.getOrderMetrics = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DATE(created_at) as date, 
       COUNT(*) as orders,
       COUNT(*) FILTER (WHERE status IN ('shipped', 'delivered')) as fulfilled
       FROM orders WHERE org_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`,
      [req.user.orgId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order metrics' });
  }
};

exports.getWarehousePerformance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.name, w.warehouse_id,
       COUNT(DISTINCT o.order_id) as total_orders,
       COUNT(DISTINCT i.item_id) as total_items,
       COALESCE(SUM(i.quantity), 0) as total_inventory,
       ROUND(COALESCE(SUM(i.quantity)::numeric / NULLIF(w.capacity, 0) * 100, 0), 1) as capacity_utilization
       FROM warehouses w
       LEFT JOIN inventory_items i ON w.warehouse_id = i.warehouse_id
       LEFT JOIN orders o ON w.warehouse_id = o.warehouse_id
       WHERE w.org_id = $1
       GROUP BY w.warehouse_id, w.name, w.capacity`,
      [req.user.orgId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warehouse performance' });
  }
};
