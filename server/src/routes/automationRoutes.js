const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.get('/', auth, rbac(['admin', 'manager']), automationController.listRules);
router.get('/:id', auth, rbac(['admin', 'manager']), automationController.getRule);
router.post('/', auth, rbac(['admin', 'manager']), automationController.createRule);
router.patch('/:id', auth, rbac(['admin', 'manager']), automationController.updateRule);
router.delete('/:id', auth, rbac(['admin']), automationController.deleteRule);
router.post('/:id/execute', auth, rbac(['admin', 'manager']), automationController.executeRule);

module.exports = router;
