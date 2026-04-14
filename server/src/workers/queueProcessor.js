const Queue = require('bull');
const pool = require('../database/pgClient');
const redisClient = require('../database/redisClient');
const axios = require('axios');

// Workflow execution queue
const workflowQueue = new Queue('workflow-execution', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

// Forecast processing queue
const forecastQueue = new Queue('forecast-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

// Alert processing queue
const alertQueue = new Queue('alert-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

// Workflow processor
workflowQueue.process(async (job) => {
  const { orgId, triggerType, triggerData } = job.data;
  console.log(`Processing workflow: ${triggerType} for org ${orgId}`);

  // Fetch matching automation rules
  const rules = await pool.query(
    'SELECT * FROM automation_rules WHERE org_id = $1 AND trigger_type = $2 AND status = $3 ORDER BY priority DESC',
    [orgId, triggerType, 'active']
  );

  for (const rule of rules.rows) {
    try {
      // Check if trigger conditions are met
      if (evaluateCondition(rule.trigger_conditions, triggerData)) {
        await executeActions(rule.actions, triggerData, orgId);
      }
    } catch (err) {
      console.error(`Rule ${rule.rule_id} execution failed:`, err);
    }
  }
});

// Forecast processor
forecastQueue.process(async (job) => {
  const { orgId, itemId, type } = job.data;
  console.log(`Processing forecast for item ${itemId} in org ${orgId}`);

  try {
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/api/forecast/predict`, {
      org_id: orgId,
      item_id: itemId,
      type,
    });

    // Store forecast data
    for (const forecast of response.data.forecasts) {
      await pool.query(
        'INSERT INTO forecast_data (org_id, item_id, forecast_value, confidence_lower, confidence_upper, forecast_date) VALUES ($1, $2, $3, $4, $5, $6)',
        [orgId, itemId, forecast.value, forecast.confidence_lower, forecast.confidence_upper, forecast.date]
      );
    }
  } catch (err) {
    console.error('Forecast processing failed:', err);
  }
});

// Alert processor
alertQueue.process(async (job) => {
  const { orgId, type, severity, title, message, userId, metadata } = job.data;
  
  await pool.query(
    'INSERT INTO alerts (org_id, user_id, type, severity, title, message, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [orgId, userId, type, severity, title, message, JSON.stringify(metadata || {})]
  );

  // Emit via WebSocket
  if (global.emitToOrg) {
    global.emitToOrg(orgId, 'alert:new', { type, severity, title, message });
  }
});

// Evaluate trigger conditions
function evaluateCondition(conditions, data) {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  
  // Simple condition evaluation
  for (const [key, value] of Object.entries(conditions)) {
    if (data[key] !== value) return false;
  }
  return true;
}

// Execute rule actions
async function executeActions(actions, triggerData, orgId) {
  for (const action of actions) {
    switch (action.type) {
      case 'send_alert':
        await alertQueue.add({
          orgId,
          type: 'automation',
          severity: action.severity || 'info',
          title: action.title || 'Automation Alert',
          message: action.message || '',
          userId: action.user_id,
          metadata: { rule_triggered: true, trigger_data: triggerData },
        });
        break;
      
      case 'update_status':
        if (action.resource_type === 'order') {
          await pool.query('UPDATE orders SET status = $1 WHERE order_id = $2', [action.new_status, action.resource_id]);
        }
        break;
      
      case 'send_notification':
        // Could integrate with email/SMS services
        console.log(`Notification: ${action.message}`);
        break;
      
      case 'reorder':
        // Create reorder request
        console.log(`Reorder triggered for item ${action.item_id}`);
        break;
      
      case 'webhook':
        if (action.url) {
          await axios.post(action.url, { ...triggerData, action }).catch(console.error);
        }
        break;
      
      default:
        console.log(`Unknown action type: ${action.type}`);
    }
  }
}

module.exports = { workflowQueue, forecastQueue, alertQueue };
