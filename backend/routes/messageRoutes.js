const express = require("express");

const router = express.Router();

const {
    sendMessage,
    getConversation,
    getAllChats,
    markMessagesAsRead
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");


// =========================================================
// SEND MESSAGE
// =========================================================

router.post(
    "/send",
    authMiddleware,
    sendMessage
);


// =========================================================
// GET CONVERSATION
// =========================================================

router.get(
    "/conversation/:userId",
    authMiddleware,
    getConversation
);


// =========================================================
// MARK MESSAGES AS READ
// =========================================================

router.put(
    "/read/:userId",
    authMiddleware,
    markMessagesAsRead
);


// =========================================================
// GET ALL CHATS
// =========================================================

router.get(
    "/all",
    authMiddleware,
    getAllChats
);




module.exports = router;