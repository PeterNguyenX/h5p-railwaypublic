const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VideoProgress = sequelize.define('VideoProgress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  videoId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  interactionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 1 }
  },
  answeredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  indexes: [
    { fields: ['userId', 'videoId'], name: 'idx_progress_user_video' },
    { unique: true, fields: ['userId', 'videoId', 'interactionId'], name: 'idx_progress_unique' }
  ]
});

module.exports = VideoProgress;
