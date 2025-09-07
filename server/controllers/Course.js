const Course = require("../models/Course");
const Category = require("../models/Category");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUPploader");
const CourseProgress = require("../models/CourseProgress");
const { convertSecondsToDuration } = require("../utils/SecToDuration");

// =======================================
// Create Course
// =======================================
exports.createCourse = async (req, res) => {
  try {
    console.log("REQ BODY =>", req.body);
    console.log("REQ FILES =>", req.files);

    const {
      courseName,
      courseDescription,
      price,
      tag,
      whatYouWillLearn,
      category,
      status,
      instructions,
    } = req.body;

    const instructorId = req.user.id;

    // ✅ Thumbnail
    // ✅ Thumbnail (thumbnail || thumbnailImage)
const thumbnail = req.files?.thumbnail || req.files?.thumbnailImage;
if (!thumbnail) {
  return res.status(400).json({
    success: false,
    message: "Thumbnail image is required",
  });
}


    // ✅ Upload to Cloudinary
    const uploadedImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME || "StudyNotion"
    );
    const thumbnailUrl = uploadedImage.secure_url;

    // ✅ Create course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      price,
      tag: tag ? JSON.parse(tag) : [],
      whatYouWillLearn,
      category,
      status,
      instructions: instructions ? JSON.parse(instructions) : [],
      thumbnail: thumbnailUrl, // ✅ url save hoga
      instructor: instructorId,
    });

    // ✅ Update Category with new Course
await Category.findByIdAndUpdate(
  category,
  { $push: { courses: newCourse._id } },
  { new: true }
);
    return res.status(200).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    console.error("CREATE COURSE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =======================================
// Edit Course
// =======================================
// =======================================
// Edit Course
// =======================================
exports.editCourse = async (req, res) => {
  try {
    const { courseId, updates } = req.body;   // ✅ fixes issue

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // ✅ Thumbnail update
    const thumbnail = req.files?.thumbnail || req.files?.thumbnailImage;
    if (thumbnail) {
      const uploadedImage = await uploadImageToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME || "StudyNotion"
      );
      course.thumbnail = uploadedImage.secure_url;
    }

    // ✅ Apply other updates
    if (updates) {
      for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          if (key === "tag" || key === "instructions") {
            try {
              course[key] = JSON.parse(updates[key]);
            } catch {
              course[key] = updates[key];
            }
          } else {
            course[key] = updates[key];
          }
        }
      }
    }

    await course.save();

    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "instructor",
        populate: { path: "additionalDetails" },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      });

    return res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("EDIT COURSE ERROR =>", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// =======================================
// Get All Published Courses
// =======================================
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      { status: "Published" },
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    ).populate("instructor");

    return res.status(200).json({
      success: true,
      data: allCourses,
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({
      success: false,
      message: "Can't Fetch Course Data",
      error: error.message,
    });
  }
};

// =======================================
// Get Course Details (for Preview)
// =======================================
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    const courseDetails = await Course.findById(courseId)
      .populate({
        path: "instructor",
        populate: { path: "additionalDetails" },
      })
      .populate("studentsEnrolled")
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: { path: "subSection", select: "-videoUrl" },
      });

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    // ✅ Calculate Duration
    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((sub) => {
        totalDurationInSeconds += parseInt(sub.timeDuration);
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: { courseDetails, totalDuration },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================
// Get Full Course Details (after enrollment)
// =======================================
exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const courseDetails = await Course.findById(courseId)
      .populate({
        path: "instructor",
        populate: { path: "additionalDetails" },
      })
      .populate("studentsEnrolled")
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      });

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    // ✅ Progress
    let courseProgress = await CourseProgress.findOne({
      courseID: courseId,
      userId,
    });

    // ✅ Duration
    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((sub) => {
        totalDurationInSeconds += parseInt(sub.timeDuration);
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgress?.completedVideos || [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================
// Get Instructor's Courses
// =======================================
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const instructorCourses = await Course.find({ instructor: instructorId })
      .sort({ createdAt: -1 })
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      });

    return res.status(200).json({
      success: true,
      data: instructorCourses,
    });
  } catch (error) {
    console.error("GET INSTRUCTOR COURSES ERROR =>", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    });
  }
};

// =======================================
// Delete Course
// =======================================
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Remove from enrolled students
    for (const studentId of course.studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, { $pull: { courses: courseId } });
    }

    // Delete course content
    for (const sectionId of course.courseContent) {
      const section = await Section.findById(sectionId);
      if (section) {
        for (const subSectionId of section.subSection) {
          await SubSection.findByIdAndDelete(subSectionId);
        }
      }
      await Section.findByIdAndDelete(sectionId);
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("DELETE COURSE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
