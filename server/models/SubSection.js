const mongoose = require("mongoose");

const subSectionSchema = new mongoose.Schema({

    title: {
        type: String,
    },
    timeDuration: {
        type: String,
    },
    description: {
        type: String,
    },
    videoUrl: {
        type: String,
    },
     sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
        required: true,    // ✅ Subsection ko hamesha ek section me hona chahiye
    }
});

module.exports = mongoose.model("SubSection", subSectionSchema);
