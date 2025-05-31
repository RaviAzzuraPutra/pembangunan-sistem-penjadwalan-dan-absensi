const express = require('express');
const router = express.Router();
const attendanceController = require("../controller/attendanceController");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create/:slug/event/:eventId/tahap/:tahap", upload.single("face"), attendanceController.createAttendance);
router.get("/:id", attendanceController.getAttendancesByEvent);

module.exports = router;