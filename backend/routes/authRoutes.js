const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: {
          username: !username,
          email: !email,
          password: !password,
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered",
      });
    }

    // Create user (password will be hashed by the model's beforeCreate hook)
    const user = await User.create({
      username,
      email,
      password,
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Return user data without password
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "An error occurred during registration",
      error: error.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
        missingFields: {
          username: !username,
          password: !password,
        },
      });
    }

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Check password
    let isMatch;
    try {
      isMatch = await user.validatePassword(password);
    } catch (err) {
      console.error("Password validation error:", err);
      return res.status(500).json({
        message: "Password validation failed",
        error: err.message,
      });
    }
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Return user data without password
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error (full):", error);
    res.status(500).json({
      message: "An error occurred during login",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    
    // req.user is already the user object from auth middleware, 
    // but let's fetch fresh data to be safe
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      message: "An error occurred while fetching user data",
      error: error.message,
    });
  }
});

module.exports = router;
