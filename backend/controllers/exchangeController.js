const db = require("../config/db");

const sendRequest = (req, res) => {

    const senderId = req.user.id;

    const {
        receiver_id,
        skill_offered,
        skill_requested
    } = req.body;

    const query = `
        INSERT INTO exchange_requests
        (
            sender_id,
            receiver_id,
            skill_offered,
            skill_requested
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            senderId,
            receiver_id,
            skill_offered,
            skill_requested
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to send request"
                });
            }

            // Get sender name from database
            const getNameQuery = `
                SELECT name
                FROM users
                WHERE id = ?
            `;

            db.query(
                getNameQuery,
                [senderId],
                (err, userResult) => {

                    if (!err && userResult.length > 0) {

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
                                "New Exchange Request",
                                `${senderName} sent you an exchange request.`
                            ]
                        );
                    }
                }
            );

            res.status(201).json({
                success: true,
                message:
                    "Exchange Request Sent Successfully!"
            });

        }
    );
};

const getIncomingRequests = (req, res) => {

    const userId = req.user.id;

    const query = `
        SELECT
            exchange_requests.id,
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

    db.query(query, [userId], (err, result) => {

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

    });
};

const getSentRequests = (req, res) => {

    const userId = req.user.id;

    const query = `
        SELECT
            exchange_requests.id,
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

    db.query(query, [userId], (err, result) => {

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

    });

};

const acceptRequest = (req, res) => {

    const userId = req.user.id;
    const requestId = req.params.id;

    const query = `
        UPDATE exchange_requests
        SET status = 'Accepted'
        WHERE id = ?
        AND receiver_id = ?
    `;

    db.query(
        query,
        [requestId, userId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Request not found or unauthorized"
                });
            }

            res.status(200).json({
                success: true,
                message: "Request Accepted Successfully!"
            });

        }
    );
};

const rejectRequest = (req, res) => {

    const userId = req.user.id;
    const requestId = req.params.id;

    const query = `
        UPDATE exchange_requests
        SET status = 'Rejected'
        WHERE id = ?
        AND receiver_id = ?
    `;

    db.query(
        query,
        [requestId, userId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Request not found or unauthorized"
                });
            }

            res.status(200).json({
                success: true,
                message: "Request Rejected Successfully!"
            });

        }
    );
};

const completeExchange = (req, res) => {

    const userId = req.user.id;
    const requestId = req.params.id;

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
        [requestId, userId, userId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Exchange not found or not accepted yet"
                });
            }

            res.status(200).json({
                success: true,
                message: "Exchange Completed Successfully!"
            });

        }
    );
};

module.exports = {
    sendRequest,
    getIncomingRequests,
    getSentRequests,
    acceptRequest,
    rejectRequest,
    completeExchange
};