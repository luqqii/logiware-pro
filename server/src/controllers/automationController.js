const pool = require('../database/pgClient');
const { logAudit } = require('../middleware/audit');

exports.listRules = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM automation_rules WHERE org_id = $1 ORDER BY priority DESC, created_at DESC', [req.user.orgId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
};

exports.getRule = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM automation_rules WHERE rule_id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
};

exports.createRule = async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_conditions, actions, priority } = req.body;
    const result = await pool.query(
      `INSERT INTO automation_rules (org_id, name, description, trigger_type, trigger_conditions, actions, priority, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.orgId, name, description, trigger_type, JSON.stringify(trigger_conditions || {}), JSON.stringify(actions), priority || 0, req.user.userId]
    );
    await logAudit(req.user.orgId, req.user.userId, 'CREATE', 'automation_rule', result.rows[0].rule_id, { name });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create automation rule' });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_conditions, actions, status, priority } = req.body;
    const result = await pool.query(
      `UPDATE automation_rules SET name = COALESCE($1, name), description = COALESCE($2, description), 
       trigger_type = COALESCE($3, trigger_type), trigger_conditions = COALESCE($4, trigger_conditions), 
       actions = COALESCE($5, actions), status = COALESCE($6, status), priority = COALESCE($7, priority), updated_at = CURRENT_TIMESTAMP 
       WHERE rule_id = $8 AND org_id = $9 RETURNING *`,
      [name, description, trigger_type, trigger_conditions ? JSON.stringify(trigger_conditions) : undefined, actions ? JSON.stringify(actions) : undefined, status, priority, req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    await logAudit(req.user.orgId, req.user.userId, 'UPDATE', 'automation_rule', req.params.id, { status });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update rule' });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM automation_rules WHERE rule_id = $1 AND org_id = $2 RETURNING rule_id', [req.params.id, req.user.orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    await logAudit(req.user.orgId, req.user.userId, 'DELETE', 'automation_rule', req.params.id);
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete rule' });
  }
};

exports.executeRule = async (req, res) => {
  try {
    const rule = await pool.query('SELECT * FROM automation_rules WHERE rule_id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
    if (rule.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });

    // Here you would trigger the rule's actions
    await logAudit(req.user.orgId, req.user.userId, 'EXECUTE', 'automation_rule', req.params.id);
    res.json({ message: 'Rule executed', rule: rule.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute rule' });
  }
};
