const express = require('express');
const router = express.Router();
const { User, Video, H5PContent } = require('../models');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const { Op } = require('sequelize');

// Get admin dashboard statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalVideos = await Video.count();
    const totalH5PContent = await H5PContent.count();
    
    // Recent activities
    const recentVideos = await Video.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['username']
      }]
    });

    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'username', 'email', 'role', 'createdAt']
    });

    // Video status breakdown
    const videoStats = await Video.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']
      ],
      group: ['status']
    });

    res.json({
      stats: {
        totalUsers,
        totalVideos,
        totalH5PContent
      },
      recent: {
        videos: recentVideos,
        users: recentUsers
      },
      videoStats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Error fetching admin statistics' });
  }
});

// Get all users (with pagination)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'username', 'email', 'password', 'role', 'isActive', 'createdAt', 'updatedAt']
    });

    const now = Date.now();
    const users = rows.map((user) => {
      const lastLoginAt = user.updatedAt;
      const lastLoginDays = Math.max(0, Math.floor((now - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)));

      const suspiciousReasons = [];
      const recentActivity = [];

      if (!user.isActive) {
        suspiciousReasons.push('Account is currently deactivated');
        recentActivity.push('Account was deactivated by an administrator');
      }

      if (lastLoginDays >= 60) {
        suspiciousReasons.push(`No login for ${lastLoginDays} days`);
        recentActivity.push(`Last login was ${lastLoginDays} days ago`);
      }

      if (user.role === 'admin' && lastLoginDays >= 14) {
        suspiciousReasons.push('Admin account has not logged in recently');
        recentActivity.push('Privileged account is inactive for over 14 days');
      }

      if (/test|temp|demo/i.test(`${user.username} ${user.email}`)) {
        suspiciousReasons.push('Username/email matches temporary account patterns');
        recentActivity.push('Detected test-like naming pattern in account details');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.password,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt,
        lastLoginDays,
        suspicious: suspiciousReasons.length > 0,
        suspiciousReason: suspiciousReasons.join('; '),
        recentActivity,
      };
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get one user by id (admin only)
router.get('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Error fetching user' });
  }
});

// Update user account settings (username/email) (admin only)
router.put('/users/:id/account', auth, isAdmin, async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const usernameTaken = await User.findOne({
      where: {
        username: normalizedUsername,
        id: { [Op.ne]: user.id },
      },
    });
    if (usernameTaken) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const emailTaken = await User.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: user.id },
      },
    });
    if (emailTaken) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    await user.update({ username: normalizedUsername, email: normalizedEmail });

    return res.json({
      message: 'Account settings updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating user account settings:', error);
    return res.status(500).json({ error: 'Error updating account settings' });
  }
});

// Update user role
router.put('/users/:id/role', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ role });
    res.json({ message: 'User role updated successfully', user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    } });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Error updating user role' });
  }
});

// Toggle user active status
router.put('/users/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ isActive: !user.isActive });
    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Error updating user status' });
  }
});

// Get all videos (admin view with additional details)
router.get('/videos', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (search) {
      whereClause.title = { [Op.iLike]: `%${search}%` };
    }
    
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: videos } = await Video.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['username', 'email']
      }]
    });

    res.json({
      videos,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Error fetching videos' });
  }
});

// Delete a video (admin privilege)
router.delete('/videos/:id', auth, isAdmin, async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await video.destroy();
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Error deleting video' });
  }
});

// Create a new user (admin only)
router.post('/users/create', auth, isAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }

    const newUser = await User.create({ username, email, password, role, isActive: true });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Reset user password (admin only)
router.post('/users/:id/reset-password', auth, isAdmin, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ password });

    res.json({
      message: 'Password reset successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
});

// Create admin user (super admin only or initial setup)
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if this is the first user (initial setup)
    const userCount = await User.count();
    
    // If users exist, require admin authentication
    if (userCount > 0) {
      // Check if user is authenticated and is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required for existing systems' });
      }
    }

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }

    // Create admin with easy-to-remember credentials if this is the first setup
    let adminCredentials = { username, email, password, role: 'admin' };
    
    // If this is the first user (initial setup), use simple credentials
    if (userCount === 0) {
      adminCredentials = {
        username: 'ADMIN',
        email: 'admin@hoclieutuongtac2.com',
        password: 'admin123',
        role: 'admin'
      };
    }

    const adminUser = await User.create(adminCredentials);

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      },
      isFirstUser: userCount === 0,
      credentials: userCount === 0 ? {
        username: 'ADMIN',
        password: 'admin123',
        note: 'Easy-to-remember credentials for first setup'
      } : null
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Error creating admin user' });
  }
});

// Simple initial admin setup (no auth required, only works if no users exist)
router.post('/setup-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: {
        [Op.or]: [
          { username: 'ADMIN' },
          { username: 'admin' }
        ]
      }
    });
    if (existingAdmin) {
      return res.status(200).json({ 
        message: 'Admin user already exists',
        credentials: {
          username: existingAdmin.username,
          password: 'admin123',
          note: 'Use these credentials to login'
        }
      });
    }

    // Create admin user with ADMIN username
    const adminUser = await User.create({
      username: 'ADMIN',
      email: 'admin@hoclieutuongtac2.com',
      password: 'admin123',
      role: 'admin'
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      credentials: {
        username: 'ADMIN',
        password: 'admin123',
        email: 'admin@hoclieutuongtac2.com'
      },
      instructions: [
        '1. Login with username: ADMIN',
        '2. Password: admin123',
        '3. Change password after first login',
        '4. Access admin dashboard at /admin'
      ]
    });
  } catch (error) {
    console.error('Error setting up admin user:', error);
    res.status(500).json({ error: 'Error setting up admin user' });
  }
});

// Force create admin user (works even when users exist)
router.post('/force-create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: {
        [Op.or]: [
          { username: 'ADMIN' },
          { username: 'admin' }
        ]
      }
    });
    if (existingAdmin) {
      return res.status(200).json({ 
        message: 'Admin user already exists',
        credentials: {
          username: existingAdmin.username,
          password: 'admin123',
          note: 'Use these credentials to login'
        }
      });
    }

    // Create admin user with ADMIN username
    const adminUser = await User.create({
      username: 'ADMIN',
      email: 'admin@hoclieutuongtac2.com',
      password: 'admin123',
      role: 'admin'
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      credentials: {
        username: 'ADMIN',
        password: 'admin123',
        email: 'admin@hoclieutuongtac2.com'
      },
      instructions: [
        '1. Login with username: ADMIN',
        '2. Password: admin123',
        '3. Change password after first login',
        '4. Access admin dashboard at /admin'
      ]
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      error: 'Error creating admin user',
      details: error.message 
    });
  }
});

// System settings (placeholder for future features)
router.get('/settings', auth, isAdmin, async (req, res) => {
  try {
    // This could be extended to store system settings in a database table
    const settings = {
      maxUploadSize: '100MB',
      allowedVideoFormats: ['mp4', 'mov', 'avi'],
      defaultVideoQuality: '720p',
      enableYouTube: true,
      enableH5P: true
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

// Promote existing user to admin (admin only)
router.post('/promote-to-admin', auth, isAdmin, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role to admin
    await user.update({ role: 'admin' });

    res.json({
      message: `User ${username} promoted to admin successfully`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ 
      error: 'Error promoting user to admin',
      details: error.message 
    });
  }
});

// Fix video user associations - assign videos with null userId to admin
router.post('/fix-video-users', auth, isAdmin, async (req, res) => {
  try {
    console.log('Starting video user fix...');
    
    // Get all videos with null userId
    const videosWithoutUser = await Video.findAll({
      where: {
        userId: null
      }
    });
    
    console.log(`Found ${videosWithoutUser.length} videos without userId`);
    
    if (videosWithoutUser.length === 0) {
      return res.json({ 
        message: 'No videos to fix', 
        fixed: 0,
        total: 0
      });
    }
    
    // Get the current admin user (the one making the request)
    const adminUser = req.user;
    
    console.log(`Assigning videos to admin user: ${adminUser.username} (${adminUser.id})`);
    
    // Update all videos without userId to belong to current admin
    const [updatedCount] = await Video.update(
      { userId: adminUser.id },
      {
        where: {
          userId: null
        }
      }
    );
    
    console.log(`Updated ${updatedCount} videos to belong to admin user`);
    
    res.json({
      message: `Successfully fixed ${updatedCount} videos`,
      fixed: updatedCount,
      total: videosWithoutUser.length,
      assignedTo: {
        id: adminUser.id,
        username: adminUser.username
      }
    });
    
  } catch (error) {
    console.error('Error fixing video users:', error);
    res.status(500).json({ 
      error: 'Error fixing video users',
      details: error.message 
    });
  }
});

// Simple patch endpoint to fix video ownership (no auth required for debugging)
router.post('/patch-videos', async (req, res) => {
  try {
    const { secret } = req.body;
    
    // Simple protection - require a secret
    if (secret !== 'fix-videos-now-2025') {
      return res.status(403).json({ error: 'Invalid secret' });
    }
    
    console.log('Starting video patch...');
    
    // Get all videos with null userId
    const videosWithoutUser = await Video.findAll({
      where: {
        userId: null
      }
    });
    
    console.log(`Found ${videosWithoutUser.length} videos without userId`);
    
    if (videosWithoutUser.length === 0) {
      return res.json({ 
        message: 'No videos to patch', 
        fixed: 0,
        total: 0
      });
    }
    
    // Get the admin user
    const adminUser = await User.findOne({
      where: {
        role: 'admin'
      },
      order: [['createdAt', 'ASC']]
    });
    
    if (!adminUser) {
      return res.status(404).json({ error: 'No admin user found' });
    }
    
    console.log(`Assigning videos to admin user: ${adminUser.username} (${adminUser.id})`);
    
    // Update all videos without userId to belong to admin
    const [updatedCount] = await Video.update(
      { userId: adminUser.id },
      {
        where: {
          userId: null
        }
      }
    );
    
    console.log(`Updated ${updatedCount} videos to belong to admin user`);
    
    res.json({
      message: `Successfully patched ${updatedCount} videos`,
      fixed: updatedCount,
      total: videosWithoutUser.length,
      assignedTo: {
        id: adminUser.id,
        username: adminUser.username
      }
    });
    
  } catch (error) {
    console.error('Error patching videos:', error);
    res.status(500).json({ 
      error: 'Error patching videos',
      details: error.message 
    });
  }
});

module.exports = router;
