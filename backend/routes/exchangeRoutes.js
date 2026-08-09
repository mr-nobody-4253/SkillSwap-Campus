const express = require("express");

const router = express.Router();


// =====================================================
// CONTROLLERS
// =====================================================

const {
    createExchangePost,
    getExchangePosts,

    sendRequest,
    getIncomingRequests,
    getSentRequests,

    acceptRequest,
    rejectRequest,
    completeExchange

} = require("../controllers/exchangeController");


// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const authMiddleware =
    require("../middleware/authMiddleware");


// =====================================================
// EXCHANGE POSTS
// =====================================================


// Create Exchange Post

router.post(
    "/posts",
    authMiddleware,
    createExchangePost
);


// Get All Exchange Posts

router.get(
    "/posts",
    authMiddleware,
    getExchangePosts
);


// =====================================================
// EXCHANGE REQUESTS
// =====================================================


// Send Exchange Request

router.post(
    "/send",
    authMiddleware,
    sendRequest
);


// Incoming / Received Requests

router.get(
    "/incoming",
    authMiddleware,
    getIncomingRequests
);


// Sent Requests

router.get(
    "/sent",
    authMiddleware,
    getSentRequests
);


// Accept Request

router.put(
    "/accept/:id",
    authMiddleware,
    acceptRequest
);


// Reject Request

router.put(
    "/reject/:id",
    authMiddleware,
    rejectRequest
);


// Complete Exchange

router.put(
    "/complete/:id",
    authMiddleware,
    completeExchange
);


// =====================================================
// TEST ROUTE
// =====================================================

router.get(
    "/",
    (req, res) => {

        res.json({
            success: true,
            message: "Exchange Route Working"
        });

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;