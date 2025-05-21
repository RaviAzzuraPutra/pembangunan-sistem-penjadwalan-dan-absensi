const express = require('express');
const router = express.Router();
const TestController = require("../controller/TestResponse");

router.post('/register', TestController.register);
router.post('/recognize', TestController.recognize);

module.exports = router;
