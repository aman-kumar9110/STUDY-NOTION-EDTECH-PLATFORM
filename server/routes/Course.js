const express = require("express");
const router = express.Router();

// Controllers
const {
    createCourse,
    getAllCourses,
    getCourseDetails,
    getFullCourseDetails,
      getCourseDetailsById,
    editCourse,
    getInstructorCourses,
    deleteCourse,
} = require("../controllers/Course");

const {
    showAllCategories,
    createCategory,
    categoryPageDetails,
} = require("../controllers/Category");

const {
    createSection,
    updateSection,
    deleteSection,
} = require("../controllers/Section");

const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
} = require("../controllers/Subsection");

const {
    createRating,
    getAverageRating,
    getAllRatingReview,
} = require("../controllers/RatingAndReviews");

const {
    updateCourseProgress,
    getProgressPercentage,
} = require("../controllers/CourseProgress");

// Middlewares
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth");
console.log("Category Controllers:", { createCategory, showAllCategories, categoryPageDetails });

console.log("Middlewares:", { auth, isInstructor, isStudent, isAdmin });

// ======================= Course Routes =======================
router.post("/createCourse", auth, isInstructor, createCourse);
router.post("/editCourse", auth, isInstructor, editCourse);
router.delete("/deleteCourse", auth, isInstructor, deleteCourse);

router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);
router.get("/getAllCourses", getAllCourses);


router.post("/getCourseDetails", getCourseDetails);
router.post("/getFullCourseDetails", auth, getFullCourseDetails);

router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

// ======================= Section Routes =======================
router.post("/addSection", auth, isInstructor, createSection);
router.post("/updateSection", auth, isInstructor, updateSection);
router.post("/deleteSection", auth, isInstructor, deleteSection);

// ======================= SubSection Routes =======================
router.post("/addSubSection", auth, isInstructor, createSubSection);
router.post("/updateSubSection", auth, isInstructor, updateSubSection);
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);

// ======================= Category Routes =======================
router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategories", showAllCategories);
router.post("/getCategoryPageDetails", categoryPageDetails);

// ======================= Rating Routes =======================
router.post("/createRating", auth, isStudent, createRating);
router.get("/getAverageRating", getAverageRating);
router.get("/getReviews", getAllRatingReview);

module.exports = router;