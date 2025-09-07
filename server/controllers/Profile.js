const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUPploader");
const CourseProgress = require("../models/CourseProgress");
const mongoose = require("mongoose");
const { convertSecondsToDuration } = require("../utils/SecToDuration");
// =========================
// 📌 Update Profile
// =========================
exports.updateProfile = async (req, res) => {
    try {
        const { gender, dateofbirth, about, contactNumber } = req.body;

        const userId = req.user.id;

        // Validation
        if (!gender || !dateofbirth || !about || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Find user and their profile ID
        const userDetails = await User.findById(userId);
        const profileId = userDetails.additionalDetails;

        if (!profileId) {
            return res.status(404).json({
                success: false,
                message: "Profile not found for the user",
            });
        }

        // Find and update profile
        const profileDetails = await Profile.findById(profileId);
        profileDetails.gender = gender;
        profileDetails.dateofbirth = dateofbirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;

        await profileDetails.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profileDetails,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message,
        });
    }
};

// ========================= _____________________________
// ❌ Delete Profile and User
// =========================
exports.deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // 2. Remove user from all enrolled courses
        const enrolledCourses = user.courses || [];

        for (const courseId of enrolledCourses) {
            await Course.findByIdAndUpdate(courseId, {
                $pull: { studentsEnrolled: userId },
                $inc: { enrolledCount: -1 }
            });
        }
        // Delete the profile
        await Profile.findByIdAndDelete(user.additionalDetails);

        // Delete the user
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "User and profile deleted successfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting user and profile",
            error: error.message,
        });
    }
};


exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        let userDetails = await User.findOne({
            _id: userId,
        })
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate: {
                        path: "subSection",
                    },
                },
            })
            .exec();
        userDetails = userDetails.toObject();
        var SubsectionLength = 0;
        for (var i = 0; i < userDetails.courses.length; i++) {
            let totalDurationInSeconds = 0;
            SubsectionLength = 0;
            for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
                totalDurationInSeconds += userDetails.courses[i].courseContent[
                    j
                ].subSection.reduce(
                    (acc, curr) => acc + parseInt(curr.timeDuration),
                    0
                );
                userDetails.courses[i].totalDuration = convertSecondsToDuration(
                    totalDurationInSeconds
                );
                SubsectionLength +=
                    userDetails.courses[i].courseContent[j].subSection.length;
            }


                userDetails.courses[i].status = userDetails.courses[i].status;

            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId,
            });
            courseProgressCount = courseProgressCount?.completedVideos.length;
            if (SubsectionLength === 0) {
                userDetails.courses[i].progressPercentage = 100;
            } else {
                const multiplier = Math.pow(10, 2);
                userDetails.courses[i].progressPercentage =
                    Math.round(
                        (courseProgressCount / SubsectionLength) * 100 * multiplier
                    ) / multiplier;
            }
        }

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`,
            });
        }
        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};






exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user.id;
        console.log(id);
        const user = await User.findById({ _id: id });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        await Profile.findByIdAndDelete({
            _id: new mongoose.Types.ObjectId(user.additionalDetails),
        });
        for (const courseId of user.courses) {
            await Course.findByIdAndUpdate(
                courseId,
                { $pull: { studentsEnrolled: id } },
                { new: true }
            );
        }

        await User.findByIdAndDelete({ _id: id });
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
        await CourseProgress.deleteMany({ userId: id });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ success: false, message: "User Cannot be deleted successfully" });
    }
};


//give userdetail


// =========================
// 📌 Get All User Details
// =========================

exports.getAllUserDetails = async (req, res) => {
    try {
        // Get the authenticated user's ID
        const id = req.user.id;

        // Validate and fetch user details with populated profile
        const userDetails = await User.findById(id)
            .populate("additionalDetails")
            .exec();

        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Return response
        return res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            data: userDetails,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching user data",
            error: error.message,
        });
    }
};

exports.updateDisplayPicture = async (req, res) => {
    try {
        console.log("FILES RECEIVED:", req.files);
        const displayPicture = req.files.displaypicture;

        const userId = req.user.id;
        console.log("FOLDER_NAME:", process.env.FOLDER_NAME);

        const image = await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        );
        console.log(image);
        const updatedProfile = await User.findByIdAndUpdate(
            { _id: userId },
            { image: image.secure_url },
            { new: true }
        );
        res.send({
            success: true,
            message: `Image Updated successfully`,
            data: updatedProfile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.instructorDashboard = async (req, res) => {
    try {
        const courseDetails = await Course.find({ instructor: req.user.id });

        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length;
            const totalAmountGenerated = totalStudentsEnrolled * course.price;

            const courseDataWithStats = {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,

                totalStudentsEnrolled,
                totalAmountGenerated,
            };

            return courseDataWithStats;
        });

        res.status(200).json({ courses: courseData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
