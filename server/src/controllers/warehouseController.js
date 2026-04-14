const pool = require('../database/pgClient');
const { logAudit } = require('../middleware/audit');

exports.listWarehouses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM warehouses WHERE org_id = $1 ORDER BY created_at DESC',
      [req.user.orgId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
};

exports.getWarehouse = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM warehouses WHERE warehouse_id = $1 AND org_id = $2',
      [req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const { name, location, latitude, longitude, capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO warehouses (org_id, name, location, latitude, longitude, capacity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.orgId, name, location, latitude, longitude, capacity || 0]
    );
    await logAudit(req.user.orgId, req.user.userId, 'CREATE', 'warehouse', result.rows[0].warehouse_id, { name });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const { name, location, latitude, longitude, capacity, status } = req.body;
    const result = await pool.query(
      'UPDATE warehouses SET name = COALESCE($1, name), location = COALESCE($2, location), latitude = COALESCE($3, latitude), longitude = COALESCE($4, longitude), capacity = COALESCE($5, capacity), status = COALESCE($6, status), updated_at = CURRENT_TIMESTAMP WHERE warehouse_id = $7 AND org_id = $8 RETURNING *',
      [name, location, latitude, longitude, capacity, status, req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    await logAudit(req.user.orgId, req.user.userId, 'UPDATE', 'warehouse', result.rows[0].warehouse_id, { name });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM warehouses WHERE warehouse_id = $1 AND org_id = $2 RETURNING warehouse_id',
      [req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    await logAudit(req.user.orgId, req.user.userId, 'DELETE', 'warehouse', req.params.id);
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
};
