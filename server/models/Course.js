const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        trim: true,
    },
    courseDescription: {
        type: String,
        required: true,
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    whatYouWillLearn: {
        type: String,
        required: true,
    },
    courseContent: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section",
        }
    ],
    ratingAndReviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RatingAndReviews",
        }
    ],
    price: {
        type: Number,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    instructions: {
        type: [String],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Category",
    },
    tag: {
        type: [String],
        required: true,
    },
   studentsEnrolled: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "User",
  default: [],
},

     status: {
        type: String,
        enum: ["Draft", "Published"],
        default: "Published",
    },
},

    { timestamps: true } // Optional but recommended
);

module.exports = mongoose.model("Course", courseSchema);
