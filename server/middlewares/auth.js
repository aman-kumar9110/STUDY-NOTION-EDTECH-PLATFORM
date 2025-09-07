

const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");



exports.auth = async (req, res, next) => {
  try {
    let token;

    // 🔐 Safely extract token
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.body.token) {
      token = req.body.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ❌ Token missing
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    // ✅ Verify token
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying token",
    });
  }
};

//is student 

exports.isStudent = async (req, res, next) => {

    try {

        if (req.user.accountType != "Student") {
            return res.status(401).json({
                success: false,
                message: 'this is protected route for student only',
            })
        }

        next();

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: 'user role cannot verified',
        })
    }
}
//is instructor

exports.isInstructor = async (req, res, next) => {

    try {

        if (req.user.accountType != "Instructor") {
            return res.status(401).json({
                success: false,
                message: 'this is protected route for Instructor only',
            })
        }

        next();

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: 'user role cannot verified',
        })
    }
}
//isAdmin

exports.isAdmin = async (req, res, next) => {

    try {

        if (req.user.accountType != "Admin") {
            return res.status(401).json({
                success: false,
                message: 'this is protected route for admin only',
            })
        }

        next();

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: 'user role cannot verified',
        })
    }
}