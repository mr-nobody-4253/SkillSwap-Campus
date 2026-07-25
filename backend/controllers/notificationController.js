const db = require("../config/db");

const getNotifications = (req, res) => {

    const userId = req.user.id;

    const query = `
        SELECT *
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
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
            total_notifications: result.length,
            data: result
        });

    });

};

const markAsRead = (req, res) => {

    const notificationId = req.params.id;
    const userId = req.user.id;

    const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        query,
        [notificationId, userId],
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
                        "Notification not found"
                });
            }

            res.status(200).json({
                success: true,
                message:
                    "Notification marked as read."
            });

        }
    );
};



module.exports = {
    getNotifications,
    markAsRead
};