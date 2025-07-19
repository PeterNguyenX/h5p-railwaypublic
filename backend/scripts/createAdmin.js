const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function createInitialAdmin() {
  try {
    // Check if any admin users exist
    const adminCount = await User.count({
      where: { role: 'admin' }
    });

    if (adminCount > 0) {
      console.log('Admin user already exists. Skipping creation.');
      return;
    }

    // Check if this is the first user (no users at all)
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('Creating initial admin user...');
      
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@hoclieutuongtac2.com',
        password: 'Admin123!', // You should change this after first login
        role: 'admin'
      });

      console.log('✅ Initial admin user created successfully!');
      console.log('Username: admin');
      console.log('Email: admin@hoclieutuongtac2.com');
      console.log('Password: Admin123!');
      console.log('🔒 Please change the password after first login!');
    } else {
      console.log('Users exist but no admin found. Admin user must be created through the admin panel by an existing admin.');
    }
  } catch (error) {
    console.error('Error creating initial admin user:', error);
  }
}

module.exports = { createInitialAdmin };

// If this script is run directly
if (require.main === module) {
  createInitialAdmin().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}
