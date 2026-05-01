const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { LoginAttempt } = require("../models");
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validation/schemas');
const { sendPasswordResetEmail } = require('../services/emailService');
const logger = require('../utils/logger');

const router = express.Router();

// Register
router.post('/register', validate(registerSchema), async (req, res) => {
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
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    const usernameOrEmail = typeof username === 'string' ? username.trim() : '';

    // Validate input
    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        message: "Username/email and password are required",
        missingFields: {
          username: !usernameOrEmail,
          password: !password,
        },
      });
    }

    // Find by either username or email for better UX.
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail.toLowerCase() },
        ],
      },
    });
    if (!user) {
      LoginAttempt.create({ email: usernameOrEmail, ipAddress: req.ip || req.headers['x-forwarded-for'], success: false, failureReason: 'INVALID_CREDENTIALS' }).catch(() => {});
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Account deactivated",
        error: "Account deactivated",
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
      LoginAttempt.create({ email: user.email, userId: user.id, ipAddress: req.ip || req.headers['x-forwarded-for'], success: false, failureReason: 'INVALID_CREDENTIALS' }).catch(() => {});
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    LoginAttempt.create({ email: user.email, userId: user.id, ipAddress: req.ip || req.headers['x-forwarded-for'], success: true }).catch(() => {});
    await user.update({ lastLoginAt: new Date() });

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
    });
  }
});

// Update current account login credentials (username/email)
router.put('/account', auth, async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required.' });
    }

    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      return res.status(400).json({ message: 'Username must be between 3 and 30 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const usernameTaken = await User.findOne({
      where: {
        username: normalizedUsername,
        id: { [Op.ne]: user.id },
      },
    });

    if (usernameTaken) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    const emailTaken = await User.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: user.id },
      },
    });

    if (emailTaken) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    await user.update({
      username: normalizedUsername,
      email: normalizedEmail,
    });

    return res.json({
      message: 'Account details updated successfully.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Update account failed', { error: error.message });
    return res.status(500).json({ message: 'Unable to update account right now.' });
  }
});

// Change current account password (requires old password)
router.put('/account/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const oldPasswordMatches = await user.validatePassword(String(oldPassword));
    if (!oldPasswordMatches) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    user.password = String(newPassword);
    await user.save();

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('Change password failed', { error: error.message });
    return res.status(500).json({ message: 'Unable to change password right now.' });
  }
});

// REQ-5: Request password reset (30-minute, single-use token)
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;

    // Always return a generic response to prevent account enumeration
    const genericResponse = {
      message: 'If the account exists, a password reset email has been sent.',
    };

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await user.update({
      resetToken: hashedToken,
      resetTokenExpiry,
    });

    await sendPasswordResetEmail(user.email, rawToken);
    return res.json(genericResponse);
  } catch (error) {
    logger.error('Forgot password failed', { error: error.message });
    return res.status(500).json({ message: 'Unable to process reset request right now.' });
  }
});

// REQ-5: Apply new password if token is valid and not expired
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ message: 'Password reset successful.' });
  } catch (error) {
    logger.error('Reset password failed', { error: error.message });
    return res.status(500).json({ message: 'Unable to reset password right now.' });
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

const enableDebugAuthEndpoint =
  process.env.ENABLE_DEBUG_AUTH_ENDPOINT === 'true' &&
  process.env.NODE_ENV !== 'production';

if (enableDebugAuthEndpoint) {
  // Debug auth endpoint
  router.get("/debug", async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.json({ error: "No token provided" });
      }

      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        const User = require('../models/User');
        const user = await User.findOne({ where: { id: decoded.userId || decoded.id } });
        
        res.json({
          token: "provided",
          decoded: decoded,
          userFound: !!user,
          user: user ? { id: user.id, username: user.username, role: user.role } : null,
          jwtSecret: process.env.JWT_SECRET ? "set" : "not set"
        });
      } catch (jwtError) {
        res.json({
          error: "JWT verification failed",
          message: jwtError.message,
          jwtSecret: process.env.JWT_SECRET ? "set" : "not set"
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = router;
