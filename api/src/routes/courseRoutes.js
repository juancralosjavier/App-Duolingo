const express = require("express");
const router = express.Router();
const {
  getCourses,
  createCourse,
  getCourseDetail,
  getLessonDetail
} = require("../controllers/courseController");

router.get("/", getCourses);
router.get("/:id", getCourseDetail);
router.get("/lessons/:lessonId", getLessonDetail);
router.post("/", createCourse);

module.exports = router;