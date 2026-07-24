const express = require("express");
const router = express.Router();

const {
    sendRequest,
    getIncomingRequests,
    getSentRequests,
    acceptRequest,
    rejectRequest,
    completeExchange
} = require("../controllers/exchangeController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
    "/send",
    authMiddleware,
    sendRequest
);
router.get(
    "/incoming",
    authMiddleware,
    getIncomingRequests
);
router.get(
    "/sent",
    authMiddleware,
    getSentRequests
);
router.put(
    "/accept/:id",
    authMiddleware,
    acceptRequest
);
router.put(
    "/reject/:id",
    authMiddleware,
    rejectRequest
);
router.put(
    "/complete/:id",
    authMiddleware,
    completeExchange
);

module.exports = router;