const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const loginUser = (req, res) => {

    const { email, password } = req.body;

    const query = "SELECT * FROM users WHERE email = ?";

    db.query(query, [email], async (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        // User not found
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found!"
            });
        }

        const user = result[0];

        // Compare Password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password!"
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login Successful!",
            token
        });

    });
};

const registerUser = async (req, res) => {
    try {

        const { name, email, password, department, semester } = req.body;

        // Check if user already exists
        const checkQuery = "SELECT * FROM users WHERE email = ?";

        db.query(checkQuery, [email], async (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error",
                    error: err
                });
            }

            if (result.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists!"
                });
            }

            // Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert User
            const insertQuery = `
                INSERT INTO users
                (name, email, password, department, semester)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertQuery,
                [name, email, hashedPassword, department, semester],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Failed to Register User",
                            error: err
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "User Registered Successfully!"
                    });
                }
            );
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    registerUser,
    loginUser
};