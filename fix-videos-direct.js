#!/usr/bin/env node

// Simple script to fix video ownership without requiring complex authentication
const { Sequelize, DataTypes } = require('sequelize');

async function fixVideoOwnership() {
  let sequelize;
  
  try {
    // Connect to database using Railway DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found');
    }
    
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    });
    
    console.log('Connected to database');
    
    // Simple raw SQL to fix the issue
    const [results] = await sequelize.query(`
      UPDATE "Videos" 
      SET "userId" = (
        SELECT id FROM "Users" 
        WHERE role = 'admin' 
        ORDER BY "createdAt" ASC 
        LIMIT 1
      )
      WHERE "userId" IS NULL;
    `);
    
    console.log(`Updated ${results.rowCount || 'unknown'} videos`);
    
    // Verify the fix
    const [videos] = await sequelize.query(`
      SELECT id, title, "userId" FROM "Videos" 
      WHERE "userId" IS NOT NULL 
      ORDER BY "createdAt" DESC;
    `);
    
    console.log(`Videos after fix:`, videos);
    
    console.log('✅ Video ownership fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing video ownership:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

fixVideoOwnership();
