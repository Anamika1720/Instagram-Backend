import mongoose from "mongoose";
import { PostModel } from "../models/Post.js";
import multer from "multer";
import { UserModel } from "../models/User.js";

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Get All Posts with Pagination
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await PostModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await PostModel.find()
      .populate("likes.userId", "username")
      .populate("comments.userId", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedPosts = posts.map((post) => ({
      ...post._doc,
      imageUrl:
        post.imageUrl.includes("https://") || post.imageUrl.includes("http://")
          ? post.imageUrl
          : `${req.protocol}://${req.get("host")}/uploads/${post.imageUrl
              .split("/")
              .pop()}`,
    }));

    res.json({
      posts: formattedPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,

        postsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching posts" });
  }
};

// Add new post
export const uploadPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const { caption } = req.body;
    const userId = req.user.userId;
    const username = req.user.username;

    // console.log("User Object in uploadPost:", req.user);
    // console.log("UserId in uploadPost:", req.user?.userId);
    // console.log("Username in uploadPost:", req.user?.username);

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    console.log("Uploaded File:", req.file);

    const newPost = new PostModel({
      postId: new Date().getTime().toString(),
      userId: userId,
      username: username,
      caption,
      imageUrl: fileUrl,
      likes: [],
      comments: [],
    });

    // console.log("Post Data Before Save:", newPost);

    await newPost.save();
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error uploading image", details: error.message });
  }
};

// Get Comments for a Post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await PostModel.findById(postId).populate({
      path: "comments.userId",
      select: "username",
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const commentsWithUser = post.comments.map((comment) => ({
      text: comment.text,
      username: comment.userId.username,
    }));

    res.json({
      comments: commentsWithUser,
      commentCount: post.comments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Error fetching comments" });
  }
};

// Add Comment to Post
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;
    const username = req.user.username;

    console.log("Post Id:", postId);
    console.log("Comment text:", text);
    console.log("User Id:", userId);
    console.log("Username:", username);

    if (!text || typeof text !== "string" || text.trim() === "") {
      console.log("Missing or invalid comment text");
      return res.status(400).json({
        error: "Comment text is required ",
      });
    }

    if (!req.user || !req.user.userId) {
      console.log("User ID is missing!");
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      console.log("Post not found!");
      return res.status(404).json({ error: "Post not found" });
    }
    console.log("userId", userId);

    const newComment = {
      userId: userId,
      username: username,
      text: text.trim(),
      timestamp: new Date(),
    };

    const updateComment = await PostModel.updateOne(
      { _id: postId },
      {
        $push: {
          comments: {
            userId: userId,
            username: username,
            text: text.trim(),
            timestamp: new Date(),
          },
        },
      }
    );

    console.log("updateComment :", updateComment);

    console.log(" Comment added successfully!");
    res.json(post);
  } catch (error) {
    console.error(" Error adding comment:", error);
    res
      .status(500)
      .json({ error: "Error adding comment", details: error.message });
  }
};

// Like/Unlike Post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // console.log("Received Post ID:", postId);
    // console.log("User ID for like:", userId);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }

    const post = await PostModel.findById(new mongoose.Types.ObjectId(postId));
    if (!post) {
      // console.log("Post not found!");
      return res.status(404).json({ error: "Post not found" });
    }

    // Toggle Like/Unlike
    const existingLikeIndex = post.likes.findIndex(
      (like) => like.userId.toString() === userId
    );
    if (existingLikeIndex !== -1) {
      post.likes.splice(existingLikeIndex, 1);
    } else {
      post.likes.push({ userId });
    }

    await post.save({ validateBeforeSave: false });

    // console.log("Like Updated", post.likes.length);
    res.json({ likesCount: post.likes.length, likes: post.likes });
  } catch (error) {
    // console.error("Error updating like:", error);
    res
      .status(500)
      .json({ error: "Error updating like", details: error.message });
  }
};
