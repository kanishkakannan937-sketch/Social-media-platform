const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        const savedUser = await user.save();

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

// Follow / Unfollow User
router.put("/:id/follow", authMiddleware, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (userToFollow._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const alreadyFollowing = currentUser.following.includes(
            userToFollow._id
        );

        if (alreadyFollowing) {
            currentUser.following = currentUser.following.filter(
                id => id.toString() !== userToFollow._id.toString()
            );

            userToFollow.followers = userToFollow.followers.filter(
                id => id.toString() !== currentUser._id.toString()
            );

            await currentUser.save();
            await userToFollow.save();

            return res.json({
                message: "User unfollowed successfully"
            });
        }

        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);

        await currentUser.save();
        await userToFollow.save();

        res.json({
            message: "User followed successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to follow user",
            error: error.message
        });
    }
});

// GET logged-in user's profile
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            followersCount: user.followers.length,
            followingCount: user.following.length
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch profile"
        });
    }
});

module.exports = router;