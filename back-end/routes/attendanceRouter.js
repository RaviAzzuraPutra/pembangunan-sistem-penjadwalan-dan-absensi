const express = require('express');
const router = express.Router();
const attendanceController = require("../controller/attendanceController");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create/:slug/event/:eventId/tahap/:tahap", upload.single("face"), attendanceController.createAttendance);
router.post("/remind/:userId/event/:eventId", attendanceController.remindUserPush);
router.post("/push-subscription", attendanceController.saveSubscription);
router.get("/:eventId", attendanceController.getAttendancesByEvent);
router.post("/out-of-bounds", attendanceController.monitoringLocation);
router.get("/active/:user_id", attendanceController.getActiveEventByUser);
router.post("/periodic-face-verification", upload.single("face"), attendanceController.periodicFaceVerification);
router.post("/periodic-face-fail", attendanceController.periodicFaceFail);
module.exports = router;