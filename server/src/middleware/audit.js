const pool = require('../database/pgClient');
const { getMongoDb } = require('../database/mongoClient');
const { v4: uuidv4 } = require('uuid');

async function logAudit(orgId, userId, action, resourceType, resourceId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id, details) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, userId, action, resourceType, resourceId, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

async function logInventoryEvent(itemId, eventType, quantityChange, notes, userId) {
  try {
    const db = await getMongoDb();
    await db.collection('inventory_events').insertOne({
      event_id: uuidv4(),
      item_id: itemId,
      event_type: eventType,
      quantity_change: quantityChange,
      notes,
      user_id: userId,
      created_at: new Date(),
    });

    await pool.query(
      `INSERT INTO inventory_events (item_id, event_type, quantity_change, notes, user_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [itemId, eventType, quantityChange, notes, userId]
    );
  } catch (err) {
    console.error('Inventory event log error:', err);
  }
}

module.exports = { logAudit, logInventoryEvent };
