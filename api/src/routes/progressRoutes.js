const express = require("express");
const router = express.Router();
const {
  saveProgress,
  getUserProgress
} = require("../controllers/progressController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/", requireAuth, saveProgress);
router.get("/me", requireAuth, getUserProgress);

module.exports = router;
