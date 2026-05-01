const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginAttempt = sequelize.define('LoginAttempt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  failureReason: {
    type: DataTypes.ENUM(
      'INVALID_CREDENTIALS',
      'USER_NOT_FOUND',
      'ACCOUNT_INACTIVE',
      'TOO_MANY_ATTEMPTS',
      'OTHER'
    ),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'LoginAttempts',
  timestamps: false,
  indexes: [
    { fields: ['userId', 'timestamp'] },
    { fields: ['ipAddress', 'timestamp'] },
    { fields: ['email', 'timestamp'] },
    { fields: ['success'] }
  ]
});

module.exports = LoginAttempt;
