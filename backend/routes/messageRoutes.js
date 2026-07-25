const express = require("express");
const router = express.Router();

const {
    sendMessage,
    getConversation,
    getAllChats
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
    "/send",
    authMiddleware,
    sendMessage
);
router.get(
    "/conversation/:userId",
    authMiddleware,
    getConversation
);
router.get(
    "/all",
    authMiddleware,
    getAllChats
);

module.exports = router;