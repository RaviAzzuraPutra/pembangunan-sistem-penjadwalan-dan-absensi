const express = require('express');
const router = express.Router();
const jobdeskController = require("../controller/jobdeskController");

router.post("/create", jobdeskController.createJobdesk);
router.get("/", jobdeskController.getAllJobdesk);

module.exports = router;