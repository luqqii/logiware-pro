const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.get('/', auth, rbac(['admin', 'manager']), forecastController.getForecast);
router.get('/summary', auth, rbac(['admin', 'manager']), forecastController.getForecastSummary);
router.get('/models', auth, rbac(['admin', 'manager']), forecastController.listForecastModels);
router.post('/train', auth, rbac(['admin', 'manager']), forecastController.trainForecast);

module.exports = router;
