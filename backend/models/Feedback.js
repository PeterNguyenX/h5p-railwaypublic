const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Feedback = sequelize.define('Feedback', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('bug', 'feature', 'improvement', 'other'),
    defaultValue: 'other'
  },
  status: {
    type: DataTypes.ENUM('new', 'in-progress', 'resolved', 'closed'),
    defaultValue: 'new'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  language: {
    type: DataTypes.ENUM('en', 'vi'),
    defaultValue: 'en'
  }
});

// Define associations
Feedback.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Feedback, {
  foreignKey: 'userId',
  as: 'feedbacks'
});

module.exports = Feedback; 