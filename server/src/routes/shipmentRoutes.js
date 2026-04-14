const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.get('/', auth, rbac(['admin', 'manager', 'user']), shipmentController.listShipments);
router.get('/track/:trackingNumber', auth, rbac(['admin', 'manager', 'user']), shipmentController.trackShipment);
router.get('/:id', auth, rbac(['admin', 'manager', 'user']), shipmentController.getShipment);
router.post('/', auth, rbac(['admin', 'manager']), shipmentController.createShipment);
router.patch('/:id', auth, rbac(['admin', 'manager']), shipmentController.updateShipment);

module.exports = router;
