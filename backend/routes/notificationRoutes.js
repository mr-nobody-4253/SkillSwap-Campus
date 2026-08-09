// =====================================================
// SKILLSWAP CAMPUS
// NOTIFICATION ROUTES
// =====================================================

const express = require("express");

const router = express.Router();

const {
  getNotifications,

  markAsRead,

  markAllAsRead,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// GET ALL NOTIFICATIONS
// =====================================================

router.get("/", authMiddleware, getNotifications);

// =====================================================
// MARK ALL AS READ
// =====================================================

router.put("/read-all", authMiddleware, markAllAsRead);

// =====================================================
// MARK SINGLE AS READ
// =====================================================

router.put("/read/:id", authMiddleware, markAsRead);

module.exports = router;
