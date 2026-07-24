const express = require("express");
require("dotenv").config();

const skillRoutes = require("./routes/skillRoutes");

const exchangeRoutes = require("./routes/exchangeRoutes");

console.log(process.env.JWT_SECRET);

const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");


const app = express();
const PORT = 5000;

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/exchange", exchangeRoutes);

app.get("/", (req, res) => {
    res.send("SkillSwap Campus Server is Running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});