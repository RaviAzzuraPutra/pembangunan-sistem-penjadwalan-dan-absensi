const express = require('express');
const router = express.Router();
const eventController = require("../controller/eventController");

router.post('/create', eventController.createEvent);

router.get('/', eventController.getAllEvent);

router.get('/available-employees', eventController.getAvailableEmployees);

router.get('/:id', eventController.getEventById);

router.get('/:slug', eventController.getEventBySlug);

router.put('/update/:id', eventController.updateEvent);

router.delete('/delete/:id', eventController.deleteEvent);

router.get('/assigned/:slug', eventController.getAssignedEvents);

router.patch('/confirm/:id', eventController.confirm);

module.exports = router;