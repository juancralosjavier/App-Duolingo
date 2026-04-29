const express = require("express");
const router = express.Router();
const {
  register,
  login,
  resetPassword,
  getProfile,
  updateProfile,
} = require("../controllers/userController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, getProfile);
router.patch("/me", requireAuth, updateProfile);

module.exports = router;
