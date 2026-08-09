const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// =====================================================
// LOGIN USER
// =====================================================

const loginUser = (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    // =================================================
    // USER NOT FOUND
    // =================================================

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const user = result[0];

    console.log(user);

    // =================================================
    // COMPARE PASSWORD
    // =================================================

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password!",
      });
    }

    // =================================================
    // GENERATE JWT TOKEN
    // =================================================

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // =================================================
    // LOGIN RESPONSE
    // =================================================

    res.status(200).json({
      success: true,

      message: "Login Successful!",

      token,

      user: {
        id: user.id,

        name: user.name,

        email: user.email,

        department: user.department,

        semester: user.semester,

        profile_picture: user.profile_picture,
      },
    });
  });
};

// =====================================================
// GET PROFILE
// =====================================================

const getProfile = (req, res) => {
  const userId = req.user.id;

  const query = `
        SELECT
            id,
            name,
            email,
            department,
            semester,
            bio,
            profile_picture,
            created_at
        FROM users
        WHERE id = ?
    `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    // =================================================
    // USER NOT FOUND
    // =================================================

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // =================================================
    // PROFILE RESPONSE
    // =================================================

    res.status(200).json({
      success: true,

      data: result[0],
    });
  });
};

// =====================================================
// UPDATE PROFILE
// =====================================================

const updateProfile = (req, res) => {
    const userId = req.user.id;

    const {
        name,
        department,
        semester,
        bio,
        profile_picture
    } = req.body;

    const query = `
        UPDATE users
        SET
            name = ?,
            department = ?,
            semester = ?,
            bio = ?,
            profile_picture = ?
        WHERE id = ?
    `;

    db.query(
        query,
        [
            name,
            department,
            semester,
            bio,
            profile_picture,
            userId
        ],
        (err, result) => {

            if (err) {
                console.error("Update Profile Error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to update profile"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const getUserQuery = `
                SELECT
                    id,
                    name,
                    email,
                    department,
                    semester,
                    bio,
                    profile_picture
                FROM users
                WHERE id = ?
            `;

            db.query(
                getUserQuery,
                [userId],
                (err, userResult) => {

                    if (err) {
                        console.error(
                            "Get Updated User Error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Profile updated but failed to fetch updated user"
                        });
                    }

                    if (userResult.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: "User not found"
                        });
                    }

                    const user = userResult[0];

                    const token = jwt.sign(
                        {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: "7d"
                        }
                    );

                    return res.status(200).json({
                        success: true,
                        message:
                            "Profile Updated Successfully!",
                        token,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            department: user.department,
                            semester: user.semester,
                            bio: user.bio,
                            profile_picture:
                                user.profile_picture
                        }
                    });
                }
            );
        }
    );
};

// =====================================================
// REGISTER USER
// =====================================================

const registerUser = async (req, res) => {
  try {
    const { name, email, password, department, semester } = req.body;

    // =================================================
    // CHECK IF USER ALREADY EXISTS
    // =================================================

    const checkQuery = "SELECT * FROM users WHERE email = ?";

    db.query(checkQuery, [email], async (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,

          message: "Database Error",

          error: err,
        });
      }

      // =================================================
      // EMAIL ALREADY EXISTS
      // =================================================

      if (result.length > 0) {
        return res.status(400).json({
          success: false,

          message: "Email already exists!",
        });
      }

      // =================================================
      // HASH PASSWORD
      // =================================================

      const hashedPassword = await bcrypt.hash(password, 10);

      // =================================================
      // INSERT USER
      // =================================================

      const insertQuery = `
                    INSERT INTO users
                    (
                        name,
                        email,
                        password,
                        department,
                        semester
                    )
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

              error: err,
            });
          }

          // =================================================
          // REGISTRATION SUCCESS
          // =================================================

          res.status(201).json({
            success: true,

            message: "Registration Successful!",
          });
        },
      );
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  registerUser,

  loginUser,

  getProfile,

  updateProfile,
};
