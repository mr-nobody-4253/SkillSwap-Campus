const express = require("express");

const router = express.Router();

const {
    createPost,
    getAllPosts,
    getMyPosts,
    searchPosts
} = require("../controllers/postController");

const authMiddleware =
    require("../middleware/authMiddleware");


router.post(
    "/create",
    authMiddleware,
    createPost
);

router.get(
    "/all",
    getAllPosts
);

router.get(
    "/my-posts",
    authMiddleware,
    getMyPosts
);

router.get(
    "/search",
    searchPosts
);

module.exports = router;