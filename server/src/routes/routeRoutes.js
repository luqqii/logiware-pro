const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.get('/', auth, rbac(['admin', 'manager']), routeController.listRoutes);
router.get('/:id', auth, rbac(['admin', 'manager']), routeController.getRoute);
router.post('/optimize', auth, rbac(['admin', 'manager']), routeController.optimizeRoute);
router.patch('/:id', auth, rbac(['admin', 'manager']), routeController.updateRoute);
router.get('/vehicles/list', auth, rbac(['admin', 'manager']), routeController.listVehicles);
router.post('/vehicles', auth, rbac(['admin', 'manager']), routeController.createVehicle);
router.patch('/vehicles/:id', auth, rbac(['admin', 'manager']), routeController.updateVehicle);

module.exports = router;
