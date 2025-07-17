// Project model
// Fields: id (UUID), user_id (UUID), title (String), thumbnail_url (String), created_at (Timestamp)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thumbnail_url: {
    type: DataTypes.STRING,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'projects',
  timestamps: false,
});

module.exports = Project;
