const express = require('express');
const router = express.Router({ mergeParams: true });
const tenantController = require('../controllers/tenantController');

router.route('/add').post(tenantController.createTenant);

module.exports = router;
