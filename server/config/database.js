// db.js
const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => {
            console.log("✅ Database connected successfully");
        })
        .catch((err) => {
            console.error("❌ Database connection failed");
            console.error(err);
            process.exit(1); // Exit the app if DB fails to connect
        });
};
