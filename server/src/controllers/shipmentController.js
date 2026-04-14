const pool = require('../database/pgClient');
const { logAudit } = require('../middleware/audit');

exports.listShipments = async (req, res) => {
  try {
    const { status, carrier } = req.query;
    let query = 'SELECT * FROM shipments WHERE org_id = $1';
    const params = [req.user.orgId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    if (carrier) {
      paramCount++;
      query += ` AND carrier = $${paramCount}`;
      params.push(carrier);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
};

exports.getShipment = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipments WHERE shipment_id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
};

exports.createShipment = async (req, res) => {
  try {
    const { order_id, carrier, tracking_number, origin_address, destination_address, eta, weight, shipping_cost } = req.body;
    const result = await pool.query(
      `INSERT INTO shipments (org_id, order_id, carrier, tracking_number, origin_address, destination_address, eta, weight, shipping_cost) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.orgId, order_id, carrier, tracking_number, origin_address, destination_address, eta, weight, shipping_cost]
    );
    await logAudit(req.user.orgId, req.user.userId, 'CREATE', 'shipment', result.rows[0].shipment_id, { carrier, tracking_number });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create shipment' });
  }
};

exports.updateShipment = async (req, res) => {
  try {
    const { status, tracking_number, eta, actual_delivery } = req.body;
    const result = await pool.query(
      `UPDATE shipments SET status = COALESCE($1, status), tracking_number = COALESCE($2, tracking_number), 
       eta = COALESCE($3, eta), actual_delivery = COALESCE($4, actual_delivery), updated_at = CURRENT_TIMESTAMP 
       WHERE shipment_id = $5 AND org_id = $6 RETURNING *`,
      [status, tracking_number, eta, actual_delivery, req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    await logAudit(req.user.orgId, req.user.userId, 'UPDATE', 'shipment', req.params.id, { status });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update shipment' });
  }
};

exports.trackShipment = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT shipment_id, tracking_number, carrier, status, eta, destination_address FROM shipments WHERE tracking_number = $1 AND org_id = $2',
      [req.params.trackingNumber, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to track shipment' });
  }
};
