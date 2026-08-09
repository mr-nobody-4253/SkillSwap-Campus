const db = require("../config/db");

// =====================================================
// SEND MESSAGE
// =====================================================

const sendMessage = (req, res) => {
    const senderId = req.user.id;

    const { receiver_id, message } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!receiver_id || !message || !message.trim()) {
        return res.status(400).json({
            success: false,
            message: "Receiver and message are required",
        });
    }

    // Prevent sending message to yourself
    if (Number(senderId) === Number(receiver_id)) {
        return res.status(400).json({
            success: false,
            message: "You cannot send a message to yourself",
        });
    }

    // -------------------------------------------------
    // INSERT MESSAGE
    // -------------------------------------------------

    const query = `
        INSERT INTO messages
        (
            sender_id,
            receiver_id,
            message,
            is_read
        )
        VALUES (?, ?, ?, 0)
    `;

    db.query(
        query,
        [senderId, receiver_id, message.trim()],
        (err, result) => {

            if (err) {
                console.error(
                    "SEND MESSAGE DATABASE ERROR:",
                    err
                );

                console.log("Sender ID:", senderId);
                console.log("Receiver ID:", receiver_id);
                console.log("Message:", message);

                return res.status(500).json({
                    success: false,
                    message: "Failed to send message",
                    error: err.message,
                });
            }

            console.log(
                "MESSAGE INSERTED SUCCESSFULLY"
            );

            console.log(
                "Message ID:",
                result.insertId
            );

            // -------------------------------------------------
            // CREATE NOTIFICATION
            // -------------------------------------------------

            const userQuery = `
                SELECT name
                FROM users
                WHERE id = ?
            `;

            db.query(
                userQuery,
                [senderId],
                (userErr, userResult) => {

                    if (userErr) {
                        console.error(
                            "GET SENDER NAME ERROR:",
                            userErr
                        );

                        return;
                    }

                    if (
                        userResult &&
                        userResult.length > 0
                    ) {

                        const senderName =
                            userResult[0].name;

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
                                "New Message",
                                `${senderName} sent you a message.`,
                            ],
                            (notificationErr) => {

                                if (notificationErr) {
                                    console.error(
                                        "NOTIFICATION INSERT ERROR:",
                                        notificationErr
                                    );
                                } else {
                                    console.log(
                                        "NOTIFICATION CREATED"
                                    );
                                }

                            }
                        );
                    }

                }
            );

            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            return res.status(201).json({
                success: true,
                message: "Message Sent Successfully!",
                message_id: result.insertId,
            });

        }
    );
};


// =====================================================
// GET CONVERSATION
// =====================================================

const getConversation = (req, res) => {

    const currentUserId = req.user.id;

    const otherUserId = req.params.userId;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!otherUserId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required",
        });
    }

    // -------------------------------------------------
    // GET MESSAGES
    // -------------------------------------------------

    const query = `
        SELECT
            id,
            sender_id,
            receiver_id,
            message,
            is_read,
            sent_at
        FROM messages
        WHERE
            (
                sender_id = ?
                AND receiver_id = ?
            )
            OR
            (
                sender_id = ?
                AND receiver_id = ?
            )
        ORDER BY sent_at ASC
    `;

    db.query(
        query,
        [
            currentUserId,
            otherUserId,
            otherUserId,
            currentUserId
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "GET CONVERSATION ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database Error",
                    error: err.message,
                });
            }

            return res.status(200).json({
                success: true,
                total_messages: result.length,
                data: result,
            });

        }
    );
};


// =====================================================
// MARK MESSAGES AS READ
// =====================================================

const markMessagesAsRead = (req, res) => {

    console.log(
        "===== MARK AS READ CALLED ====="
    );

    const currentUserId = req.user.id;

    const otherUserId = req.params.userId;

    console.log(
        "Current User ID:",
        currentUserId
    );

    console.log(
        "Other User ID:",
        otherUserId
    );

    // -------------------------------------------------
    // UPDATE ONLY RECEIVED UNREAD MESSAGES
    // -------------------------------------------------

    const query = `
        UPDATE messages
        SET is_read = 1
        WHERE
            sender_id = ?
            AND receiver_id = ?
            AND is_read = 0
    `;

    db.query(
        query,
        [
            otherUserId,
            currentUserId
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "MARK AS READ ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to mark messages as read",
                    error: err.message,
                });
            }

            console.log(
                "Messages marked as read:",
                result.affectedRows
            );

            return res.status(200).json({
                success: true,
                message:
                    "Messages marked as read",
                updated:
                    result.affectedRows,
            });

        }
    );
};


// =====================================================
// GET ALL CHATS
// WITH LAST MESSAGE + LATEST MESSAGE SORT
// =====================================================

const getAllChats = (req, res) => {

    const userId = req.user.id;

    // -------------------------------------------------
    // GET ALL USERS WITH CONVERSATIONS
    // AND THEIR LATEST MESSAGE
    // -------------------------------------------------

    const query = `
        SELECT
            users.id,
            users.name,
            users.email,

            latest_message.message AS last_message,

            latest_message.sent_at AS last_message_time,

            latest_message.sender_id AS last_message_sender_id,

            COUNT(
                CASE
                    WHEN messages.receiver_id = ?
                    AND messages.is_read = 0
                    THEN 1
                END
            ) AS unread_count

        FROM users

        INNER JOIN messages
        ON
            (
                users.id = messages.sender_id
                OR
                users.id = messages.receiver_id
            )

        LEFT JOIN messages AS latest_message
        ON latest_message.id = (
            SELECT m2.id
            FROM messages AS m2
            WHERE
                (
                    m2.sender_id = ?
                    AND m2.receiver_id = users.id
                )
                OR
                (
                    m2.sender_id = users.id
                    AND m2.receiver_id = ?
                )
            ORDER BY
                m2.sent_at DESC,
                m2.id DESC
            LIMIT 1
        )

        WHERE
            (
                messages.sender_id = ?
                OR
                messages.receiver_id = ?
            )

            AND users.id != ?

        GROUP BY
            users.id,
            users.name,
            users.email,
            latest_message.message,
            latest_message.sent_at,
            latest_message.sender_id

        ORDER BY
            latest_message.sent_at DESC,
            users.name ASC
    `;

    db.query(
        query,
        [
            userId,
            userId,
            userId,
            userId,
            userId,
            userId
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "GET ALL CHATS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database Error",
                    error: err.message,
                });
            }

            console.log(
                "ALL CHATS:",
                result
            );

            return res.status(200).json({
                success: true,
                total_chats: result.length,
                data: result,
            });

        }
    );
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    sendMessage,
    getConversation,
    getAllChats,
    markMessagesAsRead,
};