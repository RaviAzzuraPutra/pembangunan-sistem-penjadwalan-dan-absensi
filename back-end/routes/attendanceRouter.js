const express = require('express');
const router = express.Router();
const attendanceController = require("../controller/attendanceController");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create/:slug/event/:eventId/tahap/:tahap", upload.single("face"), attendanceController.createAttendance);
router.post("/remind/:userId/event/:eventId", attendanceController.remindUserPush);
router.post("/push-subscription", attendanceController.saveSubcription);
router.get("/:eventId", attendanceController.getAttendancesByEvent);
router.post("/out-of-bounds", attendanceController.monitoringLocation);

module.exports = router;