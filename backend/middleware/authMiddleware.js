const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        const token = authHeader.split(" ")[1];
        console.log(token);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access Denied! No Token Provided."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        res.status(401).json({
            success: false,
            message: "Invalid Token!"
        });

    }
};

module.exports = authMiddleware;