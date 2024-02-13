const express = require('express');
const baseController = require('../controllers/baseController');
const authMiddleware = require('../middleware/authMiddleware');
const { APP_ROLE_LIST } = require('../utils/roleList');

const router = express.Router();

router.route('/').get(
  authMiddleware.verifyAuth,
  authMiddleware.verifyRoles(APP_ROLE_LIST.Admin),

  baseController.getMe
);

module.exports = router;
