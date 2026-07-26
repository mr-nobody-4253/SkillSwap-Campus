const express = require("express");
require("dotenv").config();

const skillRoutes = require("./routes/skillRoutes");

const exchangeRoutes = require("./routes/exchangeRoutes");

const messageRoutes = require("./routes/messageRoutes");

const notificationRoutes = require("./routes/notificationRoutes");

console.log(process.env.JWT_SECRET);

const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");


const app = express();
const PORT = 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/", (req, res) => {
    res.send("SkillSwap Campus Server is Running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});