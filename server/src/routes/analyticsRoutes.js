const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const miscController = require('../controllers/miscController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Dashboard & Analytics
router.get('/dashboard', auth, rbac(['admin', 'manager', 'user']), analyticsController.getDashboard);
router.get('/inventory-trends', auth, rbac(['admin', 'manager']), analyticsController.getInventoryTrends);
router.get('/order-metrics', auth, rbac(['admin', 'manager']), analyticsController.getOrderMetrics);
router.get('/warehouse-performance', auth, rbac(['admin', 'manager']), analyticsController.getWarehousePerformance);

// Alerts
router.get('/alerts/list', auth, miscController.getAlerts);
router.patch('/alerts/:id/read', auth, miscController.markRead);
router.patch('/alerts/read-all', auth, miscController.markAllRead);
router.post('/alerts', auth, rbac(['admin', 'manager']), miscController.createAlert);

// Integrations
router.get('/integrations', auth, miscController.getIntegrations);
router.post('/integrations', auth, rbac(['admin']), miscController.createIntegration);
router.patch('/integrations/:id', auth, rbac(['admin']), miscController.updateIntegration);
router.delete('/integrations/:id', auth, rbac(['admin']), miscController.deleteIntegration);

module.exports = router;
