const db = require("../config/db");

const sendMessage = (req, res) => {

    const senderId = req.user.id;

    const { receiver_id, message } = req.body;

    const query = `
        INSERT INTO messages
        (
            sender_id,
            receiver_id,
            message
        )
        VALUES (?, ?, ?)
    `;

    db.query(
        query,
        [
            senderId,
            receiver_id,
            message
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to send message"
                });
            }

            db.query(
    `
    SELECT name
    FROM users
    WHERE id = ?
    `,
    [senderId],
    (err, user) => {

        if (!err && user.length > 0) {

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
                    receiver_id,
                    "New Message",
                    `${user[0].name} sent you a message.`
                ]
            );
        }
    }
);

            res.status(201).json({
                success: true,
                message: "Message Sent Successfully!"
            });

        }
    );
};

const getConversation = (req, res) => {

    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const query = `
        SELECT
            sender_id,
            receiver_id,
            message,
            sent_at
        FROM messages
        WHERE
            (sender_id = ? AND receiver_id = ?)
            OR
            (sender_id = ? AND receiver_id = ?)
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
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            res.status(200).json({
                success: true,
                total_messages: result.length,
                data: result
            });

        }
    );
};

const getAllChats = (req, res) => {

    const userId = req.user.id;

    const query = `
        SELECT DISTINCT
            users.id,
            users.name,
            users.email
        FROM users
        JOIN messages
        ON (
            users.id = messages.sender_id
            OR users.id = messages.receiver_id
        )
        WHERE
            (
                messages.sender_id = ?
                OR messages.receiver_id = ?
            )
        AND users.id != ?
    `;

    db.query(
        query,
        [userId, userId, userId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            res.status(200).json({
                success: true,
                total_chats: result.length,
                data: result
            });

        }
    );
};

module.exports = {
    sendMessage,
    getConversation,
    getAllChats
};