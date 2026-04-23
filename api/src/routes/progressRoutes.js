const express = require("express");
const router = express.Router();
const {
  saveProgress,
  getUserProgress
} = require("../controllers/progressController");

router.post("/", saveProgress);
router.get("/:userId", getUserProgress);

module.exports = router;