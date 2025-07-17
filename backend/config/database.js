const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use DATABASE_URL from Railway/Fly.io if available, otherwise use individual env vars
const databaseUrl = process.env.DATABASE_URL;

// Debug database connection information
console.log(`Database connection info:`);
console.log(`- DATABASE_URL: ${databaseUrl ? 'Set (masked)' : 'Not set'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || '3306'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME || 'h5p_wordpress'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'root'}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? 'Set (masked)' : 'Not set'}`);

let sequelize;

if (databaseUrl) {
  // Use Railway/Fly.io PostgreSQL
  console.log('🔗 Using PostgreSQL from DATABASE_URL');
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Fallback: try to use PostgreSQL with individual env vars, or fail gracefully
  console.log('⚠️ DATABASE_URL not found, checking individual database env vars...');
  
  if (process.env.DB_HOST && process.env.DB_NAME) {
    console.log('🔗 Using PostgreSQL from individual env vars');
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  } else {
    // No database config found - create a dummy sequelize that will fail gracefully
    console.log('❌ No database configuration found!');
    console.log('💡 Add PostgreSQL database in Railway Dashboard');
    console.log('💡 Or set DATABASE_URL environment variable');
    
    // Create a dummy sequelize that won't crash the app immediately
    sequelize = new Sequelize('sqlite::memory:', {
      dialect: 'sqlite',
      logging: false,
      define: {
        timestamps: false
      }
    });
    
    // Mark it as invalid so we can handle this in the app
    sequelize._isInvalid = true;
  }
}

module.exports = sequelize;