const express = require('express');
const router = express.Router();
const eventController = require("../controller/eventController");

router.post('/create', eventController.createEvent);

router.get('/', eventController.getAllEvent);

router.get('/available-employees', eventController.getAvailableEmployees);

router.get('/:id', eventController.getEventById);

router.put('/update/:id', eventController.updateEvent);

router.delete('/delete/:id', eventController.deleteEvent);

router.get('/assigned/:slug', eventController.getAssignedEvents);

router.put('/confirm/:id', eventController.confirm);

router.get('/eventInfo/:slug/info/:id', eventController.getEventInfoForEmployee);

module.exports = router;