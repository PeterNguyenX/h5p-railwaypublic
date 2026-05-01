const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentFlag = sequelize.define('ContentFlag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'h5p_content',
      key: 'id'
    }
  },
  contentType: {
    type: DataTypes.ENUM('H5P_CONTENT', 'VIDEO', 'USER_PROFILE'),
    defaultValue: 'H5P_CONTENT'
  },
  reportedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.ENUM(
      'INAPPROPRIATE',
      'SPAM',
      'OFFENSIVE',
      'COPYRIGHT',
      'TECHNICAL_ISSUE',
      'OTHER'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED', 'RESOLVED'),
    defaultValue: 'PENDING'
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  action: {
    type: DataTypes.ENUM('NONE', 'WARNING', 'REMOVE', 'SUSPEND_USER'),
    defaultValue: 'NONE'
  },
  flaggedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ContentFlags',
  timestamps: false,
  indexes: [
    { fields: ['contentId'] },
    { fields: ['status'] },
    { fields: ['reportedBy'] },
    { fields: ['flaggedAt'] }
  ]
});

module.exports = ContentFlag;
