require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

async function ensureAuthResetColumns() {
  const qi = sequelize.getQueryInterface();

  try {
    await sequelize.authenticate();

    const table = await qi.describeTable('Users');

    if (!Object.prototype.hasOwnProperty.call(table, 'resetToken')) {
      await qi.addColumn('Users', 'resetToken', {
        type: DataTypes.STRING,
        allowNull: true,
      });
      console.log('Added Users.resetToken');
    } else {
      console.log('Users.resetToken already exists');
    }

    if (!Object.prototype.hasOwnProperty.call(table, 'resetTokenExpiry')) {
      await qi.addColumn('Users', 'resetTokenExpiry', {
        type: DataTypes.DATE,
        allowNull: true,
      });
      console.log('Added Users.resetTokenExpiry');
    } else {
      console.log('Users.resetTokenExpiry already exists');
    }

    const updated = await qi.describeTable('Users');
    const hasResetToken = Object.prototype.hasOwnProperty.call(updated, 'resetToken');
    const hasResetTokenExpiry = Object.prototype.hasOwnProperty.call(updated, 'resetTokenExpiry');

    if (!hasResetToken || !hasResetTokenExpiry) {
      throw new Error('Migration verification failed: missing reset token columns');
    }

    console.log('Auth reset columns are ready');
    process.exit(0);
  } catch (error) {
    console.error('Failed to ensure auth reset columns:', error.message);
    process.exit(1);
  }
}

ensureAuthResetColumns();
