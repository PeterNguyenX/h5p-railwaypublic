const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
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
  thumbnailPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  h5pContent: {
    type: DataTypes.JSON,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general'
  },
  language: {
    type: DataTypes.ENUM('en', 'vi'),
    defaultValue: 'en'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Template; 