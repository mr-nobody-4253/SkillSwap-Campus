// =====================================================
// SKILLSWAP CAMPUS
// NOTIFICATION CONTROLLER
// =====================================================

const db = require("../config/db");

// =====================================================
// GET NOTIFICATIONS
// =====================================================

const getNotifications = (req, res) => {
  const userId = req.user.id;

  const query = `
        SELECT
            id,
            user_id,
            title,
            message,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Get Notifications Error:", err);

      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    res.status(200).json({
      success: true,

      total_notifications: result.length,

      unread_notifications: result.filter(
        (notification) => !notification.is_read,
      ).length,

      data: result,
    });
  });
};

// =====================================================
// MARK SINGLE NOTIFICATION AS READ
// =====================================================

const markAsRead = (req, res) => {
  const notificationId = req.params.id;

  const userId = req.user.id;

  const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = ?
        AND user_id = ?
    `;

  db.query(query, [notificationId, userId], (err, result) => {
    if (err) {
      console.error("Mark Notification Read Error:", err);

      return res.status(500).json({
        success: false,

        message: "Database Error",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,

        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,

      message: "Notification marked as read.",
    });
  });
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

const markAllAsRead = (req, res) => {
  const userId = req.user.id;

  const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = ?
        AND is_read = FALSE
    `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Mark All Notifications Read Error:", err);

      return res.status(500).json({
        success: false,

        message: "Database Error",
      });
    }

    res.status(200).json({
      success: true,

      message: "All notifications marked as read.",

      updated: result.affectedRows,
    });
  });
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getNotifications,

  markAsRead,

  markAllAsRead,
};
