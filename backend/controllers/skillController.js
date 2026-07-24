const db = require("../config/db");

const addSkill = (req, res) => {

    const userId = req.user.id;

    const {
        skill_name,
        type,
        description
    } = req.body;

    const query = `
        INSERT INTO skills
        (user_id, skill_name, type, description)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            userId,
            skill_name,
            type,
            description
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to add skill"
                });
            }

            res.status(201).json({
                success: true,
                message: "Skill Added Successfully!"
            });
        }
    );
};

const getMySkills = (req, res) => {

    const userId = req.user.id;

    const query = `
        SELECT
            id,
            skill_name,
            type,
            description,
            created_at
        FROM skills
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(query, [userId], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        res.status(200).json({
            success: true,
            total_skills: result.length,
            data: result
        });
    });
};

const updateSkill = (req, res) => {

    const userId = req.user.id;
    const skillId = req.params.id;

    const {
        skill_name,
        type,
        description
    } = req.body;

    const query = `
        UPDATE skills
        SET
            skill_name = ?,
            type = ?,
            description = ?
        WHERE id = ? AND user_id = ?
    `;

    db.query(
        query,
        [
            skill_name,
            type,
            description,
            skillId,
            userId
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to update skill"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Skill not found or unauthorized"
                });
            }

            res.status(200).json({
                success: true,
                message: "Skill Updated Successfully!"
            });
        }
    );
};

const deleteSkill = (req, res) => {

    const userId = req.user.id;
    const skillId = req.params.id;

    const query = `
        DELETE FROM skills
        WHERE id = ? AND user_id = ?
    `;

    db.query(query, [skillId, userId], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete skill"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Skill not found or unauthorized"
            });
        }

        res.status(200).json({
            success: true,
            message: "Skill Deleted Successfully!"
        });

    });

};

const searchSkills = (req, res) => {

    const keyword = req.query.keyword;

    const query = `
        SELECT
            skills.id,
            skills.skill_name,
            skills.type,
            skills.description,
            users.name,
            users.department
        FROM skills
        JOIN users
        ON skills.user_id = users.id
        WHERE skills.skill_name LIKE ?
    `;

    db.query(
        query,
        [`%${keyword}%`],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            res.status(200).json({
                success: true,
                total_results: result.length,
                data: result
            });
        }
    );
};

module.exports = {
    addSkill,
    getMySkills,
    updateSkill,
    deleteSkill,
    searchSkills
};