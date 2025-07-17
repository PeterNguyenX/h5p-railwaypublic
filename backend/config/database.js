const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use DATABASE_URL from Fly.io if available, otherwise use individual env vars
const databaseUrl = process.env.DATABASE_URL;

// Debug database connection information
console.log(`Database connection info:`);
console.log(`- DATABASE_URL: ${databaseUrl ? 'Set (masked)' : 'Not set'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST || 'Not set'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || 'Not set'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME || 'Not set'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'Not set'}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? 'Set (masked)' : 'Not set'}`);

const sequelize = databaseUrl 
  ? new Sequelize(databaseUrl, {
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
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: 'database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

module.exports = sequelize;