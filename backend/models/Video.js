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
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true // Allow null for YouTube videos
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
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // New fields for YouTube integration
  youtubeUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  youtubeId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // New fields for video editing
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
    type: DataTypes.JSONB,
    allowNull: true
  },
  // New field for LTI integration
  ltiLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // New field for templates
  templateId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // New field for language
  language: {
    type: DataTypes.ENUM('en', 'vi'),
    defaultValue: 'en'
  }
});

// Define associations
Video.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

User.hasMany(Video, {
  foreignKey: 'userId',
  as: 'videos'
});

module.exports = Video; 