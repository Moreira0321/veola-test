const express = require("express");
const userRoutes = require("./user.routes");
const authRoutes = require("./auth.routes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);

router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
});

module.exports = router;
