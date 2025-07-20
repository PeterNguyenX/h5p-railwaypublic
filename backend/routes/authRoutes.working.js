const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Simple test route
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes working", timestamp: new Date().toISOString() });
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // For now, just return success (we'll add database later)
    res.json({ 
      message: "Registration endpoint working", 
      data: { username, email } 
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login route  
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // For now, just return success (we'll add database later)
    const token = jwt.sign(
      { userId: "test-user-id", username }, 
      process.env.JWT_SECRET || "test-secret", 
      { expiresIn: '24h' }
    );

    res.json({ 
      message: "Login endpoint working", 
      token,
      user: { username, role: "admin" }
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Me route
router.get("/me", (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret");
    res.json({
      id: decoded.userId,
      username: decoded.username,
      role: "admin"
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
