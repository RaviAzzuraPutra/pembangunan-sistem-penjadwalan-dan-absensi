const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

router.post("/create", userController.createUser);
router.get("/", userController.getAllUser);
router.get("/:id", userController.getUserByID);
router.put("/update/:id", userController.updateUserByAdmin);
router.put("/update/:slug", userController.selfUpdateUser);
router.deleter("/delete/:id", userController.deleteUserByAdmin);

module.exports = router;