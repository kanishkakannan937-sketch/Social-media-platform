const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Social Media Platform API is Running!");
});

// Test route
app.get("/test", (req, res) => {
    res.json({
        message: "Social Media API is working"
    });
});

// Port
const PORT = process.env.PORT || 5001;

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });