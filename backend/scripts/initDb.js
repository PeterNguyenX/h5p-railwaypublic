const sequelize = require('../config/database');
const User = require('../models/User');
const Video = require('../models/Video');

async function initializeDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Force sync all models (this will drop existing tables)
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully.');

    // Create a test admin user
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Test admin user created successfully.');

    // Verify tables were created
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('Created tables:', tables[0].map(t => t.table_name));

    process.exit(0);
  } catch (error) {
    console.error('Unable to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 