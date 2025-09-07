const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile")
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // set in .env for production
const mailSender = require("../utils/mailsender");



exports.sendotp = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already registered
        const checkUserPresent = await User.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'User already registered',
            });
        }

        // Generate unique OTP
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        let result = await OTP.findOne({ otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp });
        }

        // Save OTP to DB
        const otpPayload = { email, otp };
        await OTP.create(otpPayload);


        await mailSender(email, "OTP from StudyNotion", `Your OTP is: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp, // Remove in production
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


//sign UP


exports.signup = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        console.log("Checking if user exists...");
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        console.log("Checking OTP...");
        const recentOTP = await OTP.findOne({ email }).sort({ createdAt: -1 });
        console.log("Recent OTP:", recentOTP);

        if (!recentOTP || recentOTP.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Creating profile...");
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        console.log("Creating user...");
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountType,
            contactNumber,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });

        console.log("User registered successfully");
        res.status(200).json({
            success: true,
            message: "User registered successfully",
            user,
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message, // helpful in Postman/frontend for debugging
        });
    }
};



///  LOGIN 

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // 2. Check if user exists
        const user = await User.findOne({ email }).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Please sign up.",
            });
        }

        // 3. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect",
            });
        }

        // 4. Create JWT token
        const payload = {
            id: user._id,
            email: user.email,
            accountType: user.accountType,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

        user.token = token;
        user.password = undefined; // Don't send password in response

        // 5. Cookie options
        const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            httpOnly: true,
            secure: true,
            sameSite: "None", // Use "Lax" or "Strict" if not working cross-domain
        };

        // 6. Set cookie and send response
        res.cookie("token", token, options).status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                accountType: user.accountType,
            },
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


//change password
exports.changePassword = async (req, res) => {

    try {
        // 1. Get userId from authenticated token (assuming middleware attached user to req)
        const userId = req.user.id;

        // 2. Get data from body
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // 3. Validate all fields
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // 4. Check new password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match",
            });
        }

        // 5. Get user from DB
        const user = await User.findById(userId);

        // 6. Compare old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect",
            });
        }

        // 7. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // 8. Save updated user
        await user.save();

        // 9. (Optional) Send email notification
        try {
            await mailSender(
                user.email,
                "Password Changed",
                "Your password has been changed successfully."
            );
        } catch (err) {
            console.log("Error sending email:", err.message);
        }

        // 10. Respond
        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });

    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }

}

