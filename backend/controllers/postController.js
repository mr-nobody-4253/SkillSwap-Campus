const db = require("../config/db");

// =====================================================
// CREATE POST
// =====================================================

const createPost = (req, res) => {
  const userId = req.user.id;

  const { offered_skill, wanted_skill, description } = req.body;

  const query = `
        INSERT INTO exchange_posts
        (
            user_id,
            offered_skill,
            wanted_skill,
            description
        )
        VALUES (?, ?, ?, ?)
    `;

  db.query(query, [userId, offered_skill, wanted_skill, description], (err) => {
    if (err) {
      console.error("Create Post Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to create post",
      });
    }

    res.status(201).json({
      success: true,

      message: "Post created successfully",
    });
  });
};

// =====================================================
// GET ALL POSTS
// Dashboard Feed
// =====================================================

const getAllPosts = (req, res) => {
  const query = `
        SELECT
            exchange_posts.id,
            users.name,
            exchange_posts.offered_skill,
            exchange_posts.wanted_skill,
            exchange_posts.description,
            exchange_posts.created_at

        FROM exchange_posts

        JOIN users
        ON exchange_posts.user_id = users.id

        ORDER BY exchange_posts.created_at DESC
    `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Get All Posts Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load posts",
      });
    }

    res.status(200).json({
      success: true,

      total_posts: result.length,

      data: result,
    });
  });
};

// =====================================================
// GET MY POSTS
// =====================================================

const getMyPosts = (req, res) => {
  const userId = req.user.id;

  const query = `
        SELECT
            id,
            offered_skill,
            wanted_skill,
            description,
            created_at

        FROM exchange_posts

        WHERE user_id = ?

        ORDER BY created_at DESC
    `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Get My Posts Error:", err);

      return res.status(500).json({
        success: false,

        message: "Failed to load your posts",
      });
    }

    res.status(200).json({
      success: true,

      total_posts: result.length,

      data: result,
    });
  });
};

// =====================================================
// DELETE MY POST
// =====================================================

const deletePost = (req, res) => {
  const postId = req.params.id;

  const userId = req.user.id;

  /*
        IMPORTANT:

        We are checking both:

        post ID
        AND
        logged-in user's ID

        So a user cannot delete
        someone else's post.
    */

  const query = `
        DELETE FROM exchange_posts

        WHERE id = ?

        AND user_id = ?
    `;

  db.query(query, [postId, userId], (err, result) => {
    if (err) {
      console.error("Delete Post Error:", err);

      return res.status(500).json({
        success: false,

        message: "Failed to delete post",
      });
    }

    /*
                If affectedRows = 0,
                either the post doesn't exist
                or it belongs to another user.
            */

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,

        message: "Post not found or you are not allowed to delete it",
      });
    }

    res.status(200).json({
      success: true,

      message: "Post deleted successfully",
    });
  });
};

// =====================================================
// SEARCH POSTS
// =====================================================

const searchPosts = (req, res) => {
  const skill = req.query.skill;

  const query = `
        SELECT
            exchange_posts.id,
            users.name,
            exchange_posts.offered_skill,
            exchange_posts.wanted_skill,
            exchange_posts.description

        FROM exchange_posts

        JOIN users
        ON exchange_posts.user_id = users.id

        WHERE
            offered_skill LIKE ?

            OR wanted_skill LIKE ?
    `;

  db.query(query, [`%${skill}%`, `%${skill}%`], (err, result) => {
    if (err) {
      console.error("Search Posts Error:", err);

      return res.status(500).json({
        success: false,

        message: "Failed to search posts",
      });
    }

    res.status(200).json({
      success: true,

      total_results: result.length,

      data: result,
    });
  });
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createPost,

  getAllPosts,

  getMyPosts,

  deletePost,

  searchPosts,
};
