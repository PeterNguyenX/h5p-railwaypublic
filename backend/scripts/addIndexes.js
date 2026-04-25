/**
 * Database Index Migration Script — REQ-7
 * Run once to add all missing B-tree indexes.
 * Safe to run multiple times (checks for existence first).
 */
require('dotenv').config();
const sequelize = require('../config/database');
const logger = require('../utils/logger');

async function addIndexes() {
  const qi = sequelize.getQueryInterface();
  const dialect = sequelize.getDialect();

  async function safeAddIndex(table, fields, options = {}) {
    try {
      await qi.addIndex(table, fields, options);
      console.log(`✅ Index added: ${table}(${fields.join(', ')}) ${options.name || ''}`);
    } catch (err) {
      if (
        err.message.includes('already exists') ||
        err.message.includes('SQLITE_ERROR: index') ||
        err.message.includes('Duplicate key name')
      ) {
        console.log(`⏭  Index already exists: ${table}(${fields.join(', ')})`);
      } else {
        console.error(`❌ Failed to add index on ${table}(${fields.join(', ')}): ${err.message}`);
      }
    }
  }

  await sequelize.authenticate();
  console.log(`\n📊 Adding database indexes (dialect: ${dialect})...\n`);

  // ── Users ────────────────────────────────────────────────────────────────────
  await safeAddIndex('Users', ['email'], {
    unique: true,
    name: 'idx_users_email',
  });
  await safeAddIndex('Users', ['username'], {
    unique: true,
    name: 'idx_users_username',
  });
  await safeAddIndex('Users', ['resetToken'], {
    name: 'idx_users_reset_token',
  });
  await safeAddIndex('Users', ['isActive'], {
    name: 'idx_users_is_active',
  });

  // ── Videos ───────────────────────────────────────────────────────────────────
  await safeAddIndex('Videos', ['userId'], {
    name: 'idx_videos_user_id',
  });
  await safeAddIndex('Videos', ['status'], {
    name: 'idx_videos_status',
  });
  await safeAddIndex('Videos', ['createdAt'], {
    name: 'idx_videos_created_at',
  });
  await safeAddIndex('Videos', ['userId', 'status'], {
    name: 'idx_videos_user_status',
  });

  // ── H5PContents (if table exists) ────────────────────────────────────────────
  try {
    const tables = await qi.showAllTables();
    if (tables.includes('H5PContents')) {
      await safeAddIndex('H5PContents', ['videoId'], {
        name: 'idx_h5p_video_id',
      });
      await safeAddIndex('H5PContents', ['videoId', 'timestamp'], {
        name: 'idx_h5p_video_timestamp',
      });
    }
    if (tables.includes('Feedbacks')) {
      await safeAddIndex('Feedbacks', ['videoId'], { name: 'idx_feedback_video_id' });
      await safeAddIndex('Feedbacks', ['userId'], { name: 'idx_feedback_user_id' });
    }
    if (tables.includes('projects')) {
      await safeAddIndex('projects', ['userId'], { name: 'idx_projects_user_id' });
    }
  } catch (err) {
    console.warn('Could not check optional tables:', err.message);
  }

  console.log('\n✅ Index migration complete.\n');
  process.exit(0);
}

addIndexes().catch((err) => {
  console.error('Index migration failed:', err);
  process.exit(1);
});
