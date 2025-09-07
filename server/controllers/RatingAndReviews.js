const RatingAndReview = require("../models/RatingAndReviews");
const Course = require("../models/Course");
const mongoose = require("mongoose");

exports.createRating = async (req, res) => {
    try {
        //get use id
        const userId = req.user.id;

        //get data from req body by seing model of ratig and revies
        const { rating, review, courseId } = req.body;
        //check if user  is enrolled or not
      const courseDetails = await Course.findOne({
  _id: courseId,
  studentsEnrolled: { $elemMatch: { $eq: new mongoose.Types.ObjectId(userId) } },
});

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Student is not enrolled in this course",
            });
        }
        //check user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });


        //create rating and revies
        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "Course already reviewed by user",
            });
        }


        //create ratinfg and reviews
        const ratingReview = await RatingAndReview.create({
            rating,
            review,
            course: courseId,
            user: userId,
        });
        // update course with this rating and reviws courseId
        await Course.findByIdAndUpdate(courseId, {
            $push: {
                ratingAndReviews: ratingReview._id,
            },
        });

        await courseDetails.save();
        //return response 
        return res.status(201).json({
            success: true,
            message: "Rating and review created successfully",
            ratingReview,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

exports.getAverageRating = async (req, res) => {
    try {
        const courseId = req.body.courseId;

        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                },
            },
        ]);

        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            });
        }

        return res.status(200).json({ success: true, averageRating: 0 });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve the rating for the course",
            error: error.message,
        });
    }
};

exports.getAllRatingReview = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image",
            })
            .populate({
                path: "course",
                select: "courseName",
            })
            .exec();

        res.status(200).json({
            success: true,
            data: allReviews,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve the rating and review for the course",
            error: error.message,
        });
    }
};
