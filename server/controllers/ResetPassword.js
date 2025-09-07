

const User = require("../models/User");

const mailSender = require("../utils/mailsender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");



//resetpasswordtoken

exports.resetPasswordToken = async (req, res) => {
    try {
        //get email from req body

        const { email } = req.body;

        //check user fror this email,email validation
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({
                success: false,
                message: "email not exist not registered "
            });
        }
        //genrate token
        const token = crypto.randomUUID();
        //update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 5 * 60 * 1000,
            },
            { new: true }
        );
        //create url
        const url = `http://localhost:3000/update-password/${token}`

        //send mail
        await mailSender(email,
            "Password  Reset LInk",
            `Password Reset Link:${url}`
        );
        //return response
        return res.json({
            success: true,
            message: 'Email sent sucessfull,please cheack emailand change password'
        });



    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while reset',
        });
    }


}

//ResetPassword

exports.resetPassword = async (req, res) => {

    try {
        //data fetch
        const { password, confirmPassword, token } = req.body;
        //validate
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: 'Password not matching',
            });
        }
        //get userdetails from db using token 
        const userDetails = await User.findOne({ token: token });
        //if no entry-invalid token
        if (!userDetails) {
            return res.json({
                success: false,
                message: 'token is invalid',
            });
        }
        //token time check
        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.json({
                success: false,
                message: 'Token is expired,please regenrate your token',

            })
        }
        //hash passwpord 
        const hashedPassword = await bcrypt.hash(password, 10);
        //password updte
        await User.findOneAndUpdate(
            { token: token },
            { password: hashedPassword },
            { new: true },
        )
        //return response

        return res.status(200).json({
            success: true,
            message: 'password reset sucessfully',
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while sending reset password mail'
        })
    }
}