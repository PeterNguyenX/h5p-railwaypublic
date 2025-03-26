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
    allowNull: false
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