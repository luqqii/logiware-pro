const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.get('/', auth, rbac(['admin', 'manager', 'user']), inventoryController.getInventory);
router.get('/low-stock', auth, rbac(['admin', 'manager']), inventoryController.getLowStock);
router.get('/:id', auth, rbac(['admin', 'manager', 'user']), inventoryController.getInventoryItem);
router.post('/', auth, rbac(['admin', 'manager']), inventoryController.createInventoryItem);
router.patch('/:id', auth, rbac(['admin', 'manager']), inventoryController.updateInventoryItem);
router.patch('/:id/quantity', auth, rbac(['admin', 'manager', 'user']), inventoryController.updateQuantity);
router.get('/cycle-count/:warehouse_id', auth, rbac(['admin', 'manager', 'user']), inventoryController.getCycleCount);

module.exports = router;
