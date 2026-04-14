const pool = require('../database/pgClient');

const rbacMiddleware = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Verify user still belongs to the org
      const result = await pool.query(
        'SELECT org_id, is_active FROM users WHERE user_id = $1',
        [req.user.userId]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(403).json({ error: 'User not found or deactivated' });
      }

      req.user.orgId = result.rows[0].org_id;
      next();
    } catch (err) {
      return res.status(500).json({ error: 'RBAC check failed' });
    }
  };
};

module.exports = rbacMiddleware;
