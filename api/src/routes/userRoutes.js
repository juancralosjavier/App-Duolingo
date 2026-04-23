const express = require("express");
const router = express.Router();
const {
  getUsers,
  register,
  login,
  getProfile
} = require("../controllers/userController");

router.get("/", getUsers);
router.post("/register", register);
router.post("/login", login);
router.get("/:id", getProfile);

module.exports = router;