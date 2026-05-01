const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [1, 100] }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hlsPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  thumbnailPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('processing', 'ready', 'error'),
    defaultValue: 'processing'
  },
  h5pContent: {
    type: DataTypes.JSON,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  youtubeUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isUrl: true }
  },
  youtubeId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  trimStart: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  trimEnd: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  captions: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ltiLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  language: {
    type: DataTypes.ENUM('en', 'vi'),
    defaultValue: 'en'
  },
  trashedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  aiProcessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  // REQ-7: B-tree indexes on foreign keys and common filter/sort columns
  indexes: [
    { fields: ['userId'], name: 'idx_videos_user_id' },
    { fields: ['status'], name: 'idx_videos_status' },
    { fields: ['createdAt'], name: 'idx_videos_created_at' },
    { fields: ['userId', 'status'], name: 'idx_videos_user_status' },
  ]
});

Video.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
User.hasMany(Video, { foreignKey: 'userId', as: 'videos' });

module.exports = Video;