const pool = require('../database/pgClient');
const { logAudit } = require('../middleware/audit');

exports.getAlerts = async (req, res) => {
  try {
    const { unread } = req.query;
    let query = 'SELECT * FROM alerts WHERE org_id = $1';
    const params = [req.user.orgId];

    if (unread === 'true') {
      query += ' AND is_read = false';
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await pool.query('UPDATE alerts SET is_read = true WHERE alert_id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
    res.json({ message: 'Alert marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await pool.query('UPDATE alerts SET is_read = true WHERE org_id = $1', [req.user.orgId]);
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all alerts as read' });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const { type, severity, title, message, user_id, metadata } = req.body;
    const result = await pool.query(
      'INSERT INTO alerts (org_id, user_id, type, severity, title, message, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.orgId, user_id || null, type, severity || 'info', title, message, JSON.stringify(metadata || {})]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

exports.getIntegrations = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM integrations WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
};

exports.createIntegration = async (req, res) => {
  try {
    const { type, name, config } = req.body;
    const result = await pool.query(
      'INSERT INTO integrations (org_id, type, name, config) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.orgId, type, name, JSON.stringify(config || {})]
    );
    await logAudit(req.user.orgId, req.user.userId, 'CREATE', 'integration', result.rows[0].integration_id, { type, name });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create integration' });
  }
};

exports.updateIntegration = async (req, res) => {
  try {
    const { config, status, last_sync } = req.body;
    const result = await pool.query(
      'UPDATE integrations SET config = COALESCE($1, config), status = COALESCE($2, status), last_sync = COALESCE($3, last_sync), updated_at = CURRENT_TIMESTAMP WHERE integration_id = $4 AND org_id = $5 RETURNING *',
      [config ? JSON.stringify(config) : undefined, status, last_sync, req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Integration not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update integration' });
  }
};

exports.deleteIntegration = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM integrations WHERE integration_id = $1 AND org_id = $2 RETURNING integration_id', [req.params.id, req.user.orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Integration not found' });
    await logAudit(req.user.orgId, req.user.userId, 'DELETE', 'integration', req.params.id);
    res.json({ message: 'Integration deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete integration' });
  }
};
