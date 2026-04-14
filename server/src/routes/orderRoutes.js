const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.get('/', auth, rbac(['admin', 'manager', 'user']), orderController.listOrders);
router.get('/:id', auth, rbac(['admin', 'manager', 'user']), orderController.getOrder);
router.post('/', auth, rbac(['admin', 'manager']), orderController.createOrder);
router.patch('/:id', auth, rbac(['admin', 'manager']), orderController.updateOrder);
router.delete('/:id', auth, rbac(['admin']), orderController.deleteOrder);
router.patch('/:id/receive', auth, rbac(['admin', 'manager', 'user']), orderController.receiveOrder);
router.patch('/:id/pick', auth, rbac(['admin', 'manager', 'user']), orderController.pickOrder);
router.patch('/:id/pack', auth, rbac(['admin', 'manager', 'user']), orderController.packOrder);
router.patch('/:id/ship', auth, rbac(['admin', 'manager']), orderController.shipOrder);

module.exports = router;
