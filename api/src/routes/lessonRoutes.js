const express = require("express");
const router = express.Router();
const {
  getLessonDetail
} = require("../controllers/courseController");

router.get("/:lessonId", getLessonDetail);

module.exports = router;