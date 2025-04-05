const { Sequelize } = require('sequelize');
require('dotenv').config();

async function runMigrations() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    // Import and run migrations
    const migration = require('./migrations/20240321_add_video_fields');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigrations(); 