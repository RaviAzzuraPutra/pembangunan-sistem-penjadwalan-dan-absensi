const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create", userController.createUser);

router.get("/", userController.getAllUser);

router.get("/:id", userController.getUserByID);

router.put("/update-direktur/:id", userController.updateUserByAdmin);

router.put("/update-self/:slug", upload.single("face"), userController.selfUpdateUser);

router.delete("/delete/:id", userController.deleteUser);

module.exports = router;