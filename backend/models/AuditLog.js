const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM(
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_PROMOTED',
      'USER_DEMOTED',
      'USER_ACTIVATED',
      'USER_DEACTIVATED',
      'PASSWORD_RESET',
      'VIDEO_DELETED',
      'CONTENT_FLAGGED',
      'CONTENT_UNFLAGGED',
      'SETTINGS_CHANGED',
      'ROLE_CHANGED'
    ),
    allowNull: false
  },
  targetType: {
    type: DataTypes.ENUM('USER', 'VIDEO', 'CONTENT', 'SYSTEM'),
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true // Can store before/after values, IP address, etc.
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'AuditLogs',
  timestamps: false,
  indexes: [
    { fields: ['adminId'] },
    { fields: ['action'] },
    { fields: ['targetType', 'targetId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = AuditLog;
