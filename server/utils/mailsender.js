const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try {
        // Debugging logs to check env variables
        console.log("Mail sender config:");
        console.log("User:", process.env.MAIL_USER);
        console.log("Pass:", process.env.MAIL_PASS ? "Loaded" : "Not Loaded");

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"StudyNotion 👨‍🎓" <${process.env.MAIL_USER}>`,
            to: email,
            subject: title,
            html: body,
        });

        console.log("Email sent:", info.messageId);
        return info;

    } catch (error) {
        console.error("Mail sending failed:", error);
        throw error;
    }
};

module.exports = mailSender;
