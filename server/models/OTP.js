const mongoose = require("mongoose");
const mailSender = require("../utils/mailsender");
const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 5 * 60, // 5 minutes in seconds
    },
});


async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(email, "verification Email from StudyNotion", otp);
        console.log("Email sent sucess", mailResponse);
    }
    catch (error) {
        console.log("erroe occured while sending email", error);
        throw error;
    }
}

OTPSchema.pre("save", async function (next) {
    try {
        await sendVerificationEmail(this.email, this.otp);
        next();
    } catch (error) {
        console.log("Error sending verification email in pre-save hook:", error);
        next(error);  // Pass error to Mongoose
    }
});




module.exports = mongoose.model("OTP", OTPSchema);
