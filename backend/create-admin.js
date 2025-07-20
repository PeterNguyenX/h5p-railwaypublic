// Simple script to create admin user
const { User } = require('./models');

async function createAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Username: admin');
      console.log('Try logging in with username: admin, password: admin123');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@hoclieutuongtac2.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@hoclieutuongtac2.com');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Also promote test user to admin as backup
async function promoteTestUser() {
  try {
    const testUser = await User.findOne({ where: { username: 'test' } });
    if (testUser) {
      await testUser.update({ role: 'admin' });
      console.log('✅ Test user promoted to admin!');
      console.log('You can now login with: test / test123 (admin role)');
    }
  } catch (error) {
    console.error('Error promoting test user:', error);
  }
}

// Run both
createAdmin().then(() => promoteTestUser()).then(() => process.exit(0));
