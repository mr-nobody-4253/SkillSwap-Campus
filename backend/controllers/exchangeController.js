const db = require("../config/db");


// =====================================================
// CREATE EXCHANGE POST
// =====================================================

const createExchangePost = (req, res) => {

    const userId = req.user.id;

    const {
        offered_skill,
        wanted_skill,
        description
    } = req.body;


    if (!offered_skill || !wanted_skill) {

        return res.status(400).json({
            success: false,
            message: "Offered skill and wanted skill are required"
        });

    }


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
            description || null
        ],
        (err, result) => {

            if (err) {

                console.log(
                    "Create Post Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to create exchange post"
                });

            }


            res.status(201).json({
                success: true,
                message: "Exchange post created successfully",
                post_id: result.insertId
            });

        }
    );

};


// =====================================================
// GET ALL EXCHANGE POSTS
// =====================================================

const getExchangePosts = (req, res) => {

    const query = `
        SELECT
            exchange_posts.id,
            exchange_posts.user_id,
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

                console.log(
                    "Get Exchange Posts Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
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


// =====================================================
// SEND EXCHANGE REQUEST
// =====================================================

const sendRequest = (req, res) => {

    const senderId = req.user.id;

    const {
        post_id,
        receiver_id,
        skill_offered,
        skill_requested
    } = req.body;


    if (
        !post_id ||
        !receiver_id ||
        !skill_offered ||
        !skill_requested
    ) {

        return res.status(400).json({
            success: false,
            message: "All request information is required"
        });

    }


    // -----------------------------------------------
    // Prevent requesting own post
    // -----------------------------------------------

    if (
        Number(senderId) ===
        Number(receiver_id)
    ) {

        return res.status(400).json({
            success: false,
            message: "You cannot send a request to your own post"
        });

    }


    // -----------------------------------------------
    // Check post exists and belongs to receiver
    // -----------------------------------------------

    const checkPostQuery = `
        SELECT
            id,
            user_id,
            offered_skill,
            wanted_skill
        FROM exchange_posts
        WHERE id = ?
    `;


    db.query(
        checkPostQuery,
        [post_id],
        (err, postResult) => {

            if (err) {

                console.log(
                    "Post Check Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (postResult.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Exchange post not found"
                });

            }


            const post =
                postResult[0];


            if (
                Number(post.user_id) !==
                Number(receiver_id)
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid receiver for this post"
                });

            }


            // ---------------------------------------
            // Check duplicate pending request
            // ---------------------------------------

            const duplicateQuery = `
                SELECT id
                FROM exchange_requests
                WHERE post_id = ?
                AND sender_id = ?
                AND status = 'Pending'
            `;


            db.query(
                duplicateQuery,
                [
                    post_id,
                    senderId
                ],
                (err, duplicateResult) => {

                    if (err) {

                        return res.status(500).json({
                            success: false,
                            message: "Database Error"
                        });

                    }


                    if (
                        duplicateResult.length > 0
                    ) {

                        return res.status(400).json({
                            success: false,
                            message:
                                "You already sent a request for this post"
                        });

                    }


                    // -----------------------------------
                    // Insert request
                    // -----------------------------------

                    const insertQuery = `
                        INSERT INTO exchange_requests
                        (
                            post_id,
                            sender_id,
                            receiver_id,
                            skill_offered,
                            skill_requested
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;


                    db.query(
                        insertQuery,
                        [
                            post_id,
                            senderId,
                            receiver_id,
                            skill_offered,
                            skill_requested
                        ],
                        (err, result) => {

                            if (err) {

                                console.log(
                                    "Send Request Error:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Failed to send request"
                                });

                            }


                            // -----------------------------------
                            // Get sender name
                            // -----------------------------------

                            const getNameQuery = `
                                SELECT name
                                FROM users
                                WHERE id = ?
                            `;


                            db.query(
                                getNameQuery,
                                [senderId],
                                (err, userResult) => {

                                    if (
                                        !err &&
                                        userResult.length > 0
                                    ) {

                                        const senderName =
                                            userResult[0].name;


                                        // -------------------------------
                                        // Notification
                                        // -------------------------------

                                        const notificationQuery = `
                                            INSERT INTO notifications
                                            (
                                                user_id,
                                                title,
                                                message
                                            )
                                            VALUES (?, ?, ?)
                                        `;


                                        db.query(
                                            notificationQuery,
                                            [
                                                receiver_id,
                                                "New Exchange Request",
                                                `${senderName} sent you an exchange request for your ${post.offered_skill} exchange post.`
                                            ]
                                        );

                                    }

                                }
                            );


                            res.status(201).json({
                                success: true,
                                message:
                                    "Exchange Request Sent Successfully!",
                                request_id:
                                    result.insertId
                            });

                        }
                    );

                }
            );

        }
    );

};


// =====================================================
// GET INCOMING REQUESTS
// =====================================================

const getIncomingRequests = (req, res) => {

    const userId = req.user.id;


    const query = `
        SELECT
            exchange_requests.id,
            exchange_requests.post_id,
            users.name,
            exchange_requests.skill_offered,
            exchange_requests.skill_requested,
            exchange_requests.status,
            exchange_requests.created_at
        FROM exchange_requests

        JOIN users
        ON exchange_requests.sender_id = users.id

        WHERE exchange_requests.receiver_id = ?

        ORDER BY exchange_requests.created_at DESC
    `;


    db.query(
        query,
        [userId],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            res.status(200).json({
                success: true,
                total_requests: result.length,
                data: result
            });

        }
    );

};


// =====================================================
// GET SENT REQUESTS
// =====================================================

const getSentRequests = (req, res) => {

    const userId = req.user.id;


    const query = `
        SELECT
            exchange_requests.id,
            exchange_requests.post_id,
            users.name,
            exchange_requests.skill_offered,
            exchange_requests.skill_requested,
            exchange_requests.status,
            exchange_requests.created_at
        FROM exchange_requests

        JOIN users
        ON exchange_requests.receiver_id = users.id

        WHERE exchange_requests.sender_id = ?

        ORDER BY exchange_requests.created_at DESC
    `;


    db.query(
        query,
        [userId],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            res.status(200).json({
                success: true,
                total_requests: result.length,
                data: result
            });

        }
    );

};


// =====================================================
// ACCEPT REQUEST
// =====================================================

const acceptRequest = (req, res) => {

    const userId = req.user.id;

    const requestId =
        req.params.id;


    const query = `
        UPDATE exchange_requests

        SET status = 'Accepted'

        WHERE id = ?

        AND receiver_id = ?

        AND status = 'Pending'
    `;


    db.query(
        query,
        [
            requestId,
            userId
        ],
        (err, result) => {

            if (err) {

                console.log(
                    "Accept Request Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Request not found or already processed"
                });

            }


            const getUserQuery = `
                SELECT
                    exchange_requests.sender_id,
                    users.name
                FROM exchange_requests

                JOIN users
                ON users.id = ?

                WHERE exchange_requests.id = ?
            `;


            db.query(
                getUserQuery,
                [
                    userId,
                    requestId
                ],
                (err, result) => {

                    if (
                        !err &&
                        result.length > 0
                    ) {

                        const senderId =
                            result[0].sender_id;


                        const receiverName =
                            result[0].name;


                        const notificationQuery = `
                            INSERT INTO notifications
                            (
                                user_id,
                                title,
                                message
                            )
                            VALUES (?, ?, ?)
                        `;


                        db.query(
                            notificationQuery,
                            [
                                senderId,
                                "Request Accepted",
                                `${receiverName} accepted your exchange request.`
                            ]
                        );

                    }

                }
            );


            res.status(200).json({
                success: true,
                message:
                    "Request Accepted Successfully!"
            });

        }
    );

};


// =====================================================
// REJECT REQUEST
// =====================================================

const rejectRequest = (req, res) => {

    const userId = req.user.id;

    const requestId =
        req.params.id;


    const query = `
        UPDATE exchange_requests

        SET status = 'Rejected'

        WHERE id = ?

        AND receiver_id = ?

        AND status = 'Pending'
    `;


    db.query(
        query,
        [
            requestId,
            userId
        ],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Request not found or already processed"
                });

            }


            const getUserQuery = `
                SELECT
                    exchange_requests.sender_id,
                    users.name
                FROM exchange_requests

                JOIN users
                ON users.id = ?

                WHERE exchange_requests.id = ?
            `;


            db.query(
                getUserQuery,
                [
                    userId,
                    requestId
                ],
                (err, result) => {

                    if (
                        !err &&
                        result.length > 0
                    ) {

                        db.query(
                            `
                            INSERT INTO notifications
                            (
                                user_id,
                                title,
                                message
                            )
                            VALUES (?, ?, ?)
                            `,
                            [
                                result[0].sender_id,
                                "Request Rejected",
                                `${result[0].name} rejected your exchange request.`
                            ]
                        );

                    }

                }
            );


            res.status(200).json({
                success: true,
                message:
                    "Request Rejected Successfully!"
            });

        }
    );

};


// =====================================================
// COMPLETE EXCHANGE
// =====================================================

const completeExchange = (req, res) => {

    const userId = req.user.id;

    const requestId =
        req.params.id;


    const query = `
        UPDATE exchange_requests

        SET status = 'Completed'

        WHERE id = ?

        AND (
            sender_id = ?
            OR receiver_id = ?
        )

        AND status = 'Accepted'
    `;


    db.query(
        query,
        [
            requestId,
            userId,
            userId
        ],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Exchange not found or not accepted yet"
                });

            }


            const query2 = `
                SELECT
                    sender_id,
                    receiver_id
                FROM exchange_requests
                WHERE id = ?
            `;


            db.query(
                query2,
                [requestId],
                (err, result) => {

                    if (
                        !err &&
                        result.length > 0
                    ) {

                        const otherUserId =
                            result[0].sender_id === userId
                                ? result[0].receiver_id
                                : result[0].sender_id;


                        db.query(
                            `
                            SELECT name
                            FROM users
                            WHERE id = ?
                            `,
                            [userId],
                            (err, user) => {

                                if (
                                    !err &&
                                    user.length > 0
                                ) {

                                    db.query(
                                        `
                                        INSERT INTO notifications
                                        (
                                            user_id,
                                            title,
                                            message
                                        )
                                        VALUES (?, ?, ?)
                                        `,
                                        [
                                            otherUserId,
                                            "Exchange Completed",
                                            `${user[0].name} marked the exchange as completed.`
                                        ]
                                    );

                                }

                            }
                        );

                    }

                }
            );


            res.status(200).json({
                success: true,
                message:
                    "Exchange Completed Successfully!"
            });

        }
    );

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createExchangePost,

    getExchangePosts,

    sendRequest,

    getIncomingRequests,

    getSentRequests,

    acceptRequest,

    rejectRequest,

    completeExchange

};