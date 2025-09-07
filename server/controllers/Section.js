const Section = require("../models/Section");
const Course = require("../models/Course");

//create section

exports.createSection = async (req, res) => {
  try {
    const { sectionName, courseId } = req.body;

    // 1. Validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing properties: sectionName or courseId",
      });
    }

    // 2. Create new section
    const newSection = await Section.create({ sectionName });

    // 3. Update course & get latest populated course in ONE query
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      { $push: { courseContent: newSection._id } },
      { new: true } // ✅ ensures we get updated doc
    )
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })
      .populate("category")
      .populate({
        path: "instructor",
        populate: { path: "additionalDetails" },
      })
      .exec();

    // 4. Response
    return res.status(200).json({
      success: true,
      message: "Section created and added to course",
      updatedCourse: updatedCourseDetails,  // ✅ frontend can directly use this
    });

  } catch (error) {
    console.error("Error creating section:", error);
    return res.status(500).json({
      success: false,
      message: "Cannot create section or update course",
      error: error.message,
    });
  }
};


exports.updateSection = async (req, res) => {
  try {
    const { sectionId, sectionName, courseId } = req.body;

    if (!sectionId || !sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing sectionId, sectionName, or courseId",
      });
    }

    // Update section name
    await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );

    // Fetch updated course with populated sections + subSections
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })
      .exec();

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
    updatedCourse: updatedCourse, 
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating section",
      error: error.message,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;

    if (!sectionId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing sectionId or courseId",
      });
    }

    // Remove section from courseContent
    await Course.findByIdAndUpdate(courseId, {
      $pull: { courseContent: sectionId }
    });

    // Delete section itself
    await Section.findByIdAndDelete(sectionId);

    // Fetch updated course
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })
      .exec();

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      updatedCourse: updatedCourse, 
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete section",
      error: error.message,
    });
  }
};
