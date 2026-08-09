const db = require("../config/db");

// Add Skill
const addSkill = (req, res) => {

    const userId = req.user.id;
    const { skill_name } = req.body;

    const query = `
        INSERT INTO user_skills
        (user_id, skill_name)
        VALUES (?, ?)
    `;

    db.query(
        query,
        [userId, skill_name],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to add skill"
                });
            }

            res.status(201).json({
                success: true,
                message: "Skill added successfully"
            });

        }
    );
};

// Get My Skills
const getMySkills = (req, res) => {

    const userId = req.user.id;

    db.query(
        `
        SELECT id, skill_name
        FROM user_skills
        WHERE user_id = ?
        ORDER BY id DESC
        `,
        [userId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.status(200).json({
                success: true,
                total_skills: result.length,
                data: result
            });

        }
    );
};

// Delete Skill
const deleteSkill = (req, res) => {

    const userId = req.user.id;
    const skillId = req.params.id;

    db.query(
        `
        DELETE FROM user_skills
        WHERE id = ?
        AND user_id = ?
        `,
        [skillId, userId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Skill not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Skill deleted successfully"
            });

        }
    );
};

module.exports = {
    addSkill,
    getMySkills,
    deleteSkill
};