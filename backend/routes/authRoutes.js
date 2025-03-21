const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, hashedPassword]);
    res.json({ message: "User registered!" });
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (!user.rows.length) return res.status(400).json({ error: "User not found" });

    const isValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET);
    res.json({ token });
});

module.exports = router;
