const pool = require('../database/pgClient');
const { logAudit } = require('../middleware/audit');

exports.listOrders = async (req, res) => {
  try {
    const { status, priority, warehouse_id } = req.query;
    let query = 'SELECT o.*, w.name as warehouse_name FROM orders o LEFT JOIN warehouses w ON o.warehouse_id = w.warehouse_id WHERE o.org_id = $1';
    const params = [req.user.orgId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }
    if (priority) {
      paramCount++;
      query += ` AND o.priority = $${paramCount}`;
      params.push(priority);
    }
    if (warehouse_id) {
      paramCount++;
      query += ` AND o.warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
    }

    query += ' ORDER BY o.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, w.name as warehouse_name FROM orders o 
       LEFT JOIN warehouses w ON o.warehouse_id = w.warehouse_id 
       WHERE o.order_id = $1 AND o.org_id = $2`,
      [req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    res.json({ ...result.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customer_id, customer_name, customer_email, shipping_address, priority, total_amount, notes, warehouse_id, items } = req.body;
    
    const orderResult = await pool.query(
      `INSERT INTO orders (org_id, customer_id, customer_name, customer_email, shipping_address, priority, total_amount, notes, warehouse_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.orgId, customer_id, customer_name, customer_email, shipping_address, priority || 'normal', total_amount, notes, warehouse_id]
    );

    const orderId = orderResult.rows[0].order_id;

    if (items && items.length > 0) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO order_items (order_id, item_id, sku, name, quantity, unit_price) VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, item.item_id, item.sku, item.name, item.quantity, item.unit_price]
        );
        // Decrease inventory
        await pool.query('UPDATE inventory_items SET quantity = quantity - $1, reserved_quantity = reserved_quantity + $1 WHERE item_id = $2', [item.quantity, item.item_id]);
      }
    }

    await logAudit(req.user.orgId, req.user.userId, 'CREATE', 'order', orderId, { customer_name });
    res.status(201).json(orderResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { status, priority, notes, assigned_to } = req.body;
    const result = await pool.query(
      `UPDATE orders SET status = COALESCE($1, status), priority = COALESCE($2, priority), 
       notes = COALESCE($3, notes), assigned_to = COALESCE($4, assigned_to), updated_at = CURRENT_TIMESTAMP 
       WHERE order_id = $5 AND org_id = $6 RETURNING *`,
      [status, priority, notes, assigned_to, req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    await logAudit(req.user.orgId, req.user.userId, 'UPDATE', 'order', req.params.id, { status });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM orders WHERE order_id = $1 AND org_id = $2 RETURNING order_id', [req.params.id, req.user.orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    await logAudit(req.user.orgId, req.user.userId, 'DELETE', 'order', req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

exports.receiveOrder = async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND org_id = $3', ['received', req.params.id, req.user.orgId]);
    await logAudit(req.user.orgId, req.user.userId, 'RECEIVE', 'order', req.params.id);
    res.json({ message: 'Order received' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to receive order' });
  }
};

exports.pickOrder = async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND org_id = $3', ['picked', req.params.id, req.user.orgId]);
    await logAudit(req.user.orgId, req.user.userId, 'PICK', 'order', req.params.id);
    res.json({ message: 'Order picked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pick order' });
  }
};

exports.packOrder = async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND org_id = $3', ['packed', req.params.id, req.user.orgId]);
    await logAudit(req.user.orgId, req.user.userId, 'PACK', 'order', req.params.id);
    res.json({ message: 'Order packed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pack order' });
  }
};

exports.shipOrder = async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND org_id = $3', ['shipped', req.params.id, req.user.orgId]);
    await logAudit(req.user.orgId, req.user.userId, 'SHIP', 'order', req.params.id);
    res.json({ message: 'Order shipped' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ship order' });
  }
};
