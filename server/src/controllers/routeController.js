const pool = require('../database/pgClient');
const axios = require('axios');
const { logAudit } = require('../middleware/audit');

exports.optimizeRoute = async (req, res) => {
  try {
    const { stops, vehicle_id, start_location } = req.body;
    const orgId = req.user.orgId;

    // Call AI service for route optimization
    let optimizedStops = stops;
    let totalDistance = 0;
    let estimatedDuration = 0;

    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/routes/optimize`, {
        org_id: orgId,
        stops,
        start_location,
        vehicle_id,
      });
      optimizedStops = aiResponse.data.stops;
      totalDistance = aiResponse.data.total_distance;
      estimatedDuration = aiResponse.data.estimated_duration;
    } catch (aiErr) {
      // Fallback: use stops as-is if AI service unavailable
      console.log('AI service unavailable, using original stops');
      totalDistance = stops.length * 15; // rough estimate
      estimatedDuration = stops.length * 45;
    }

    const result = await pool.query(
      `INSERT INTO routes (org_id, vehicle_id, stops, total_distance, estimated_duration, status, route_optimized) 
       VALUES ($1, $2, $3, $4, $5, 'planned', true) RETURNING *`,
      [orgId, vehicle_id, JSON.stringify(optimizedStops), totalDistance, estimatedDuration]
    );

    await logAudit(orgId, req.user.userId, 'OPTIMIZE', 'route', result.rows[0].route_id, { stops: stops.length });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Route optimization error:', err);
    res.status(500).json({ error: 'Failed to optimize route' });
  }
};

exports.listRoutes = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM routes WHERE org_id = $1';
    const params = [req.user.orgId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

exports.getRoute = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM routes WHERE route_id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Route not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch route' });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { status, eta, driver_id, driver_name, stops } = req.body;
    const result = await pool.query(
      `UPDATE routes SET status = COALESCE($1, status), eta = COALESCE($2, eta), 
       driver_id = COALESCE($3, driver_id), driver_name = COALESCE($4, driver_name),
       stops = COALESCE($5, stops), updated_at = CURRENT_TIMESTAMP 
       WHERE route_id = $6 AND org_id = $7 RETURNING *`,
      [status, eta, driver_id, driver_name, stops ? JSON.stringify(stops) : undefined, req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Route not found' });
    await logAudit(req.user.orgId, req.user.userId, 'UPDATE', 'route', req.params.id, { status });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update route' });
  }
};

exports.listVehicles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE org_id = $1 ORDER BY name', [req.user.orgId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const { name, type, capacity, license_plate } = req.body;
    const result = await pool.query(
      'INSERT INTO vehicles (org_id, name, type, capacity, license_plate) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.orgId, name, type, capacity, license_plate]
    );
    await logAudit(req.user.orgId, req.user.userId, 'CREATE', 'vehicle', result.rows[0].vehicle_id, { name });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { name, type, capacity, license_plate, status } = req.body;
    const result = await pool.query(
      'UPDATE vehicles SET name = COALESCE($1, name), type = COALESCE($2, type), capacity = COALESCE($3, capacity), license_plate = COALESCE($4, license_plate), status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP WHERE vehicle_id = $6 AND org_id = $7 RETURNING *',
      [name, type, capacity, license_plate, status, req.params.id, req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};
