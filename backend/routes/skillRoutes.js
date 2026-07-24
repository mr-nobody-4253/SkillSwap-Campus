const express = require("express");
console.log("Skill Routes Loaded");
const router = express.Router();

const {
    addSkill,
    getMySkills,
    updateSkill,
    deleteSkill,
    searchSkills
} = require("../controllers/skillController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, addSkill);
router.get("/my-skills", authMiddleware, getMySkills);
router.get("/search", authMiddleware, searchSkills);
router.put("/:id", authMiddleware, updateSkill);
router.delete("/:id", authMiddleware, deleteSkill);
router.get("/test", (req, res) => {
    res.send("Skill Routes Working");
});

module.exports = router;
