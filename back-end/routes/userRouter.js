const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

router.post("/create", userController.createUser);
router.get("/", userController.getAllUser);
router.get("/:id", userController.getUserByID);
router.put("/update-admin/:id", userController.updateUserByAdmin);
router.put("/update-self/:slug", userController.selfUpdateUser);
router.delete("/delete/:id", userController.deleteUser);

module.exports = router;