const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUPploader");

// ============================================================
// CREATE SUBSECTION
// ============================================================
exports.createSubSection = async (req, res) => {
  try {
    const { sectionId, courseId, title, description } = req.body;
    const video = req.files?.videoFile;

    if (!sectionId || !courseId || !title || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // upload video
    const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

    // create subsection
    const subSection = await SubSection.create({
      title,
      description,
      timeDuration: `${uploadDetails.duration}`,
      videoUrl: uploadDetails.secure_url,
        sectionId,
    });

    // push subsection into section
    await Section.findByIdAndUpdate(
      sectionId,
      { $push: { subSection: subSection._id } },
      { new: true }
    );

    // fetch updated course with populated sections + subsections
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })
      .exec();

    return res.status(200).json({
      success: true,
      message: "SubSection created successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Create SubSection Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error while creating SubSection",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE SUBSECTION
// ============================================================
exports.updateSubSection = async (req, res) => {
  try {
    const { subSectionId, courseId, title, description, timeDuration } = req.body;
    const video = req.files?.videoFile;

    if (!subSectionId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "SubSection ID and Course ID are required",
      });
    }

    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) {
      return res.status(404).json({ success: false, message: "SubSection not found" });
    }

    if (title) subSection.title = title;
    if (description) subSection.description = description;
    if (timeDuration) subSection.timeDuration = timeDuration;
    subSection.sectionId = sectionId;   

    if (video) {
      const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
      subSection.videoUrl = uploadDetails.secure_url;
      subSection.timeDuration = `${uploadDetails.duration}`;
    }

    await subSection.save();

    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })
      .exec();

    return res.status(200).json({
      success: true,
      message: "SubSection updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Update SubSection Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error while updating SubSection",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE SUBSECTION
// ============================================================
exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId, courseId } = req.body;

    if (!subSectionId || !sectionId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "subSectionId, sectionId and courseId are required",
      });
    }

    // remove from section
    await Section.findByIdAndUpdate(
      sectionId,
      { $pull: { subSection: subSectionId } },
      { new: true }
    );

    // delete subsection
    await SubSection.findByIdAndDelete(subSectionId);

    // fetch updated course
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })
      .exec();

    return res.status(200).json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Delete SubSection Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error while deleting SubSection",
      error: error.message,
    });
  }
};
