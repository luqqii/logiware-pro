const pool = require('../database/pgClient');
const axios = require('axios');
const { logAudit } = require('../middleware/audit');

exports.trainForecast = async (req, res) => {
  try {
    const { type } = req.body;
    const orgId = req.user.orgId;

    // Call AI service to train model
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/forecast/train`, {
      org_id: orgId,
      type: type || 'demand',
    });

    const modelResult = await pool.query(
      'INSERT INTO forecast_models (org_id, type, params, last_trained_at, status) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING *',
      [orgId, type || 'demand', JSON.stringify(aiResponse.data.params || {}), 'training']
    );

    await logAudit(orgId, req.user.userId, 'TRAIN', 'forecast', modelResult.rows[0].model_id, { type });
    res.status(201).json(modelResult.rows[0]);
  } catch (err) {
    console.error('Forecast training error:', err);
    res.status(500).json({ error: 'Failed to train forecast model' });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT f.*, i.sku, i.name as item_name FROM forecast_data f LEFT JOIN inventory_items i ON f.item_id = i.item_id WHERE f.org_id = $1 ORDER BY f.forecast_date DESC LIMIT 100',
      [req.params.orgId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
};

exports.getForecastSummary = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT f.item_id) as items_forecasted,
        AVG(f.forecast_value) as avg_forecast,
        MIN(f.forecast_value) as min_forecast,
        MAX(f.forecast_value) as max_forecast
       FROM forecast_data f WHERE f.org_id = $1`,
      [req.user.orgId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forecast summary' });
  }
};

exports.listForecastModels = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM forecast_models WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forecast models' });
  }
};
