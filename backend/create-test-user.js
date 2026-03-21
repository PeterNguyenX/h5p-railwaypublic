// Create test user for login
const sequelize = require('./config/database');
const User = require('./models/User');

async function createUser() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create test user
    const user = await User.create({
      username: 'test',
      email: 'test@example.com',
      password: 'test123',
      role: 'admin'
    });

    console.log('✅ Test user created successfully!');
    console.log('Username: test');
    console.log('Password: test123');
    console.log('Email: test@example.com');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('User already exists! Try logging in with:');
      console.log('Username: test');
      console.log('Password: test123');
      process.exit(0);
    }
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
}

createUser();
