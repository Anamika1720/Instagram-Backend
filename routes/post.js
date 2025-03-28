import express from "express";
import {
  getPosts,
  addComment,
  likePost,
  getComments,
  uploadPost,
} from "../controllers/postController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// multer configuration
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

router.get("/", getPosts);
router.get("/:postId/comments", getComments);
router.patch("/:postId/like", authMiddleware, likePost);
router.post("/:postId/comment", authMiddleware, addComment);
router.post("/upload", authMiddleware, upload.single("image"), uploadPost);

export default router;
