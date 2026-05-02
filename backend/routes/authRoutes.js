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
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService');
const logger = require('../utils/logger');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function generateToken(userId, rememberMe = false) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: rememberMe ? '30d' : '24h' });
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Register — sends verification email, does NOT return a login token
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check for existing verified account
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const code = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (existingUser && !existingUser.emailVerified) {
      // Resend code for unverified account
      await existingUser.update({
        password,
        verificationCode: code,
        verificationCodeExpiry: codeExpiry,
      });
    } else {
      await User.create({
        username,
        email,
        password,
        emailVerified: false,
        isActive: false,
        verificationCode: code,
        verificationCodeExpiry: codeExpiry,
      });
    }

    await sendVerificationEmail(email, code);

    return res.status(201).json({
      message: "Verification code sent to your email.",
      pending: true,
      email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "An error occurred during registration", error: error.message });
  }
});

// Verify email with 6-digit code — activates account, user must then log in
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid code." });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Account already verified. Please log in." });
    }

    if (!user.verificationCode || user.verificationCode !== String(code).trim()) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ message: "Verification code has expired. Please register again." });
    }

    await user.update({
      emailVerified: true,
      isActive: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    });

    return res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    logger.error('Email verification failed', { error: error.message });
    return res.status(500).json({ message: "Verification failed. Please try again." });
  }
});

// Login — supports rememberMe (30-day token) and email-verified check
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    const usernameOrEmail = typeof username === 'string' ? username.trim() : '';

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: "Username/email and password are required" });
    }

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
      return res.status(401).json({ message: "Invalid username/email or password" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    let isMatch;
    try {
      isMatch = await user.validatePassword(password);
    } catch (err) {
      return res.status(500).json({ message: "Password validation failed", error: err.message });
    }

    if (!isMatch) {
      LoginAttempt.create({ email: user.email, username: user.username, userId: user.id, ipAddress: req.ip || req.headers['x-forwarded-for'], success: false, failureReason: 'INVALID_CREDENTIALS' }).catch(() => {});
      return res.status(401).json({ message: "Invalid username/email or password" });
    }

    LoginAttempt.create({ email: user.email, username: user.username, userId: user.id, ipAddress: req.ip || req.headers['x-forwarded-for'], success: true }).catch(() => {});
    await user.update({ lastLoginAt: new Date() });

    const token = generateToken(user.id, !!rememberMe);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        theme: user.theme || 'light',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "An error occurred during login", error: error.message });
  }
});

// Save user theme preference
router.put('/preferences', auth, async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme || !['light', 'dark'].includes(theme)) {
      return res.status(400).json({ message: "theme must be 'light' or 'dark'" });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.update({ theme });
    return res.json({ message: "Preferences saved.", theme });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save preferences" });
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
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const usernameTaken = await User.findOne({ where: { username: normalizedUsername, id: { [Op.ne]: user.id } } });
    if (usernameTaken) return res.status(400).json({ message: 'Username is already taken.' });

    const emailTaken = await User.findOne({ where: { email: normalizedEmail, id: { [Op.ne]: user.id } } });
    if (emailTaken) return res.status(400).json({ message: 'Email is already in use.' });

    await user.update({ username: normalizedUsername, email: normalizedEmail });

    return res.json({
      message: 'Account details updated successfully.',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
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
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const oldPasswordMatches = await user.validatePassword(String(oldPassword));
    if (!oldPasswordMatches) return res.status(400).json({ message: 'Old password is incorrect.' });

    user.password = String(newPassword);
    await user.save();

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('Change password failed', { error: error.message });
    return res.status(500).json({ message: 'Unable to change password right now.' });
  }
});

// Request password reset
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const genericResponse = { message: 'If the account exists, a password reset email has been sent.' };

    const user = await User.findOne({ where: { email } });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await user.update({ resetToken: hashedToken, resetTokenExpiry });
    await sendPasswordResetEmail(user.email, rawToken);

    return res.json(genericResponse);
  } catch (error) {
    logger.error('Forgot password failed', { error: error.message });
    return res.status(500).json({ message: 'Unable to process reset request right now.' });
  }
});

// Apply new password
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: { resetToken: hashedToken, resetTokenExpiry: { [Op.gt]: new Date() } },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' });

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

// Get current user (includes theme)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password', 'verificationCode'] } });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching user data", error: error.message });
  }
});

const enableDebugAuthEndpoint =
  process.env.ENABLE_DEBUG_AUTH_ENDPOINT === 'true' &&
  process.env.NODE_ENV !== 'production';

if (enableDebugAuthEndpoint) {
  router.get("/debug", async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) return res.json({ error: "No token provided" });
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ where: { id: decoded.userId || decoded.id } });
        res.json({ decoded, userFound: !!user, user: user ? { id: user.id, username: user.username, role: user.role } : null });
      } catch (jwtError) {
        res.json({ error: "JWT verification failed", message: jwtError.message });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = router;
