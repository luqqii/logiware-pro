const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.get('/', auth, rbac(['admin', 'manager', 'user']), warehouseController.listWarehouses);
router.get('/:id', auth, rbac(['admin', 'manager', 'user']), warehouseController.getWarehouse);
router.post('/', auth, rbac(['admin', 'manager']), warehouseController.createWarehouse);
router.patch('/:id', auth, rbac(['admin', 'manager']), warehouseController.updateWarehouse);
router.delete('/:id', auth, rbac(['admin']), warehouseController.deleteWarehouse);

module.exports = router;
