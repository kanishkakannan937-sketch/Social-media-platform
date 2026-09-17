const express = require("express");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a post
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { content, image } = req.body;

        if (!content || content.trim() === "") {
            return res.status(400).json({
                message: "Post content is required"
            });
        }

        const post = new Post({
            user: req.user.id,
            content,
            image: image || ""
        });

        const savedPost = await post.save();

        const populatedPost = await savedPost.populate(
            "user",
            "name email profileImage"
        );

        res.status(201).json({
            message: "Post created successfully",
            post: populatedPost
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create post",
            error: error.message
        });
    }
});

// Get all posts
router.get("/", async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user", "name email profileImage")
            .populate("comments.user", "name")
            .sort({ createdAt: -1 });

        res.json(posts);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch posts",
            error: error.message
        });
    }
});

// Like / Unlike a post
router.put("/:id/like", authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const alreadyLiked = post.likes.includes(req.user.id);

        if (alreadyLiked) {
            post.likes = post.likes.filter(
                userId => userId.toString() !== req.user.id
            );
        } else {
            post.likes.push(req.user.id);
        }

        await post.save();

        res.json({
            message: alreadyLiked ? "Post unliked" : "Post liked",
            likes: post.likes.length
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to like post",
            error: error.message
        });
    }
});

// Add comment
router.post("/:id/comment", authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim() === "") {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        post.comments.push({
            user: req.user.id,
            text
        });

        await post.save();

        const updatedPost = await post.populate(
            "comments.user",
            "name"
        );

        res.json({
            message: "Comment added successfully",
            comments: updatedPost.comments
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add comment",
            error: error.message
        });
    }
});

module.exports = router;