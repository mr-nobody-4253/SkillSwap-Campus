const db = require("../config/db");

// Create Post
const createPost = (req, res) => {

    const userId = req.user.id;

    const {
        offered_skill,
        wanted_skill,
        description
    } = req.body;

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

    db.query(
        query,
        [
            userId,
            offered_skill,
            wanted_skill,
            description
        ],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to create post"
                });
            }

            res.status(201).json({
                success: true,
                message: "Post created successfully"
            });

        }
    );
};


// Get All Posts (Dashboard Feed)

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

    db.query(
        query,
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.status(200).json({
                success: true,
                total_posts: result.length,
                data: result
            });

        }
    );
};


// Get My Posts

const getMyPosts = (req, res) => {

    const userId = req.user.id;

    db.query(
        `
        SELECT
            id,
            offered_skill,
            wanted_skill,
            description,
            created_at

        FROM exchange_posts

        WHERE user_id = ?

        ORDER BY created_at DESC
        `,
        [userId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.status(200).json({
                success: true,
                total_posts: result.length,
                data: result
            });

        }
    );
};


// Search Posts

const searchPosts = (req, res) => {

    const skill = req.query.skill;

    db.query(
        `
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
        `,
        [
            `%${skill}%`,
            `%${skill}%`
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.status(200).json({
                success: true,
                total_results: result.length,
                data: result
            });

        }
    );
};

module.exports = {
    createPost,
    getAllPosts,
    getMyPosts,
    searchPosts
};