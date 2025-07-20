const express = require('express');
const router = express.Router();
const { User, Video, H5PContent } = require('../models');
const auth = require('../middleware/auth');
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

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'createdAt']
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

// Delete any video (admin privilege)
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
        username: 'admin',
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
        username: 'admin',
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
    // Check if any users exist
    const userCount = await User.count();
    
    if (userCount > 0) {
      return res.status(400).json({ 
        error: 'Admin setup only available for new installations. Users already exist.',
        existingUsers: userCount 
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'Admin user already exists',
        credentials: {
          username: 'admin',
          password: 'admin123',
          note: 'Use these credentials to login'
        }
      });
    }

    // Create simple admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@hoclieutuongtac2.com',
      password: 'admin123',
      role: 'admin'
    });

    res.status(201).json({
      message: 'Initial admin user created successfully',
      credentials: {
        username: 'admin',
        password: 'admin123',
        email: 'admin@hoclieutuongtac2.com'
      },
      instructions: [
        '1. Login with username: admin',
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

module.exports = router;
