const express = require('express');
const router = express.Router();
const forgotPasswordController = require("../controller/forgotPasswordController");

router.post("/forgot-password", forgotPasswordController.forgotPassword);
router.post("/verify-otp", forgotPasswordController.verifyOTP);
router.post("/reset-password", forgotPasswordController.resetPassword);

module.exports = router;