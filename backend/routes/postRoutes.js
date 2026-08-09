const express = require("express");

const router = express.Router();

const {
  createPost,

  getAllPosts,

  getMyPosts,

  deletePost,

  searchPosts,
} = require("../controllers/postController");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// CREATE POST
// =====================================================

router.post(
  "/create",

  authMiddleware,

  createPost,
);

// =====================================================
// GET ALL POSTS
// =====================================================

router.get(
  "/all",

  getAllPosts,
);

// =====================================================
// GET MY POSTS
// =====================================================

router.get(
  "/my-posts",

  authMiddleware,

  getMyPosts,
);

// =====================================================
// DELETE MY POST
// =====================================================

router.delete(
  "/:id",

  authMiddleware,

  deletePost,
);

// =====================================================
// SEARCH POSTS
// =====================================================

router.get(
  "/search",

  searchPosts,
);

module.exports = router;
