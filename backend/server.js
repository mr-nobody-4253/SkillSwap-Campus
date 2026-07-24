const express = require("express");
require("dotenv").config();

console.log(process.env.JWT_SECRET);

const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");


const app = express();
const PORT = 5000;

app.use(express.json());

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.send("SkillSwap Campus Server is Running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});