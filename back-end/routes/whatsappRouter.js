const express = require("express");
const router = express.Router();
const Whatsapp = require("../controller/whatsappController");

router.get("/connect", Whatsapp.getQRCode);

module.exports = router;