const { Sequelize } = require('sequelize');
require('dotenv').config();

// Prefer an explicit DATABASE_URL, but allow a Supabase-specific alias as well.
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

function shouldEnablePostgresSsl(url) {
  const sslMode = process.env.SUPABASE_DB_SSL;
  if (sslMode === 'disable') {
    return false;
  }

  if (sslMode === 'require') {
    return true;
  }

  try {
    const hostname = new URL(url).hostname;
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  } catch (error) {
    return true;
  }
}

// Debug database connection information
console.log(`Database connection info:`);
console.log(`- DATABASE_URL: ${databaseUrl ? 'Set (masked)' : 'Not set'}`);
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || '3306'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME || 'h5p_wordpress'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'root'}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? 'Set (masked)' : 'Not set'}`);

let sequelize;

if (databaseUrl) {
  // Detect dialect from DATABASE_URL
  const isMysql = databaseUrl.startsWith('mysql://');
  const dialect = isMysql ? 'mysql' : 'postgres';
  console.log(`🔗 Using ${dialect.toUpperCase()} from DATABASE_URL`);
  
  const config = {
    dialect: dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
  
  // Supabase Postgres requires SSL on hosted instances.
  if (dialect === 'postgres' && shouldEnablePostgresSsl(databaseUrl)) {
    config.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }
  
  sequelize = new Sequelize(databaseUrl, config);
} else {
  // Fallback: use SQLite for local development (easiest option)
  console.log('⚠️ DATABASE_URL not found, using SQLite for local development...');
  console.log('🔗 Using SQLITE from local file');
  
  const path = require('path');
  const dbPath = path.join(__dirname, '../h5p.db');
  
  sequelize = new Sequelize(`sqlite:${dbPath}`, {
    dialect: 'sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    storage: dbPath,
    define: {
      timestamps: true
    }
  });
}

module.exports = sequelize;