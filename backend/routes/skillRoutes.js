const express = require("express");
const router = express.Router();

const {
    addSkill,
    getMySkills,
    deleteSkill
} = require("../controllers/skillController");

const authMiddleware =
    require("../middleware/authMiddleware");

router.post(
    "/add",
    authMiddleware,
    addSkill
);

router.get(
    "/my-skills",
    authMiddleware,
    getMySkills
);

router.delete(
    "/delete/:id",
    authMiddleware,
    deleteSkill
);

router.get("/", (req, res) => {
    res.send("Skill Route Working");
});

module.exports = router;