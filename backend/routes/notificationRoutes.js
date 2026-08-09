// =====================================================
// SKILLSWAP CAMPUS
// NOTIFICATION ROUTES
// =====================================================

const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLER
// =====================================================

const {
  getNotifications,

  markAsRead,

  markAllAsRead,
} = require("../controllers/notificationController");

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// GET NOTIFICATIONS
// GET /api/notifications
// =====================================================

router.get("/", authMiddleware, getNotifications);

// =====================================================
// MARK SINGLE AS READ
// PUT /api/notifications/read/:id
// =====================================================

router.put("/read/:id", authMiddleware, markAsRead);

// =====================================================
// MARK ALL AS READ
// PUT /api/notifications/read-all
// =====================================================

router.put("/read-all", authMiddleware, markAllAsRead);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
