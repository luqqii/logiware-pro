const pool = require('../database/pgClient');
const { logAudit, logInventoryEvent } = require('../middleware/audit');

exports.getInventory = async (req, res) => {
  try {
    const { warehouse_id, category, search } = req.query;
    let query = 'SELECT * FROM inventory_items WHERE org_id = $1';
    const params = [req.user.orgId];
    let paramCount = 1;

    if (warehouse_id) {
      paramCount++;
      query += ` AND warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
    }
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

exports.getInventoryItem = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_items WHERE item_id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

exports.createInventoryItem = async (req, res) => {
  try {
    const { warehouse_id, sku, name, description, quantity, unit_price, reorder_point, category, weight, dimensions } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory_items (org_id, warehouse_id, sku, name, description, quantity, unit_price, reorder_point, category, weight, dimensions, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.user.orgId, warehouse_id, sku, name, description, quantity || 0, unit_price, reorder_point || 0, category, weight, dimensions, quantity > reorder_point ? 'in_stock' : 'low_stock']
    );
    await logAudit(req.user.orgId, req.user.userId, 'CREATE', 'inventory', result.rows[0].item_id, { sku, name });
    if (quantity) await logInventoryEvent(result.rows[0].item_id, 'receive', quantity, 'Initial stock', req.user.userId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { sku, name, description, unit_price, reorder_point, category, weight, dimensions } = req.body;
    const result = await pool.query(
      `UPDATE inventory_items SET sku = COALESCE($1, sku), name = COALESCE($2, name), description = COALESCE($3, description), 
       unit_price = COALESCE($4, unit_price), reorder_point = COALESCE($5, reorder_point), category = COALESCE($6, category), 
       weight = COALESCE($7, weight), dimensions = COALESCE($8, dimensions), updated_at = CURRENT_TIMESTAMP 
       WHERE item_id = $9 AND org_id = $10 RETURNING *`,
      [sku, name, description, unit_price, reorder_point, category, weight, dimensions, req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    await logAudit(req.user.orgId, req.user.userId, 'UPDATE', 'inventory', result.rows[0].item_id, { sku: result.rows[0].sku });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { quantity_change, reason } = req.body;
    const itemResult = await pool.query('SELECT * FROM inventory_items WHERE item_id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
    if (itemResult.rows.length === 0) return res.status(404).json({ error: 'Item not found' });

    const currentQty = itemResult.rows[0].quantity;
    const newQty = Math.max(0, currentQty + quantity_change);
    const reorderPoint = itemResult.rows[0].reorder_point;

    await pool.query(
      'UPDATE inventory_items SET quantity = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE item_id = $3',
      [newQty, newQty <= reorderPoint ? 'low_stock' : 'in_stock', req.params.id]
    );

    await logInventoryEvent(req.params.id, 'adjustment', quantity_change, reason || 'Manual adjustment', req.user.userId);

    const updated = await pool.query('SELECT * FROM inventory_items WHERE item_id = $1', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quantity' });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_items WHERE org_id = $1 AND quantity <= reorder_point ORDER BY quantity ASC',
      [req.user.orgId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
};

exports.getCycleCount = async (req, res) => {
  try {
    const { warehouse_id } = req.params;
    const result = await pool.query(
      `SELECT item_id, sku, name, quantity, category, 
       CASE WHEN quantity = 0 THEN 'empty' WHEN quantity <= reorder_point THEN 'low' ELSE 'ok' END as count_status
       FROM inventory_items WHERE warehouse_id = $1 AND org_id = $2 ORDER BY category, sku`,
      [warehouse_id, req.user.orgId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cycle count' });
  }
};
