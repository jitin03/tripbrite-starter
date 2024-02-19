const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/google-login').post(authController.googleLogin);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.post('/verification/:token', authController.verifyAccount);

router.patch(
  '/updateMyPassword',
  authMiddleware.verifyAuth,
  authController.updatePassword
);
module.exports = router;
