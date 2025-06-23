// H5PContent model
// Fields: id (UUID), project_id (UUID), json_data (JSON), created_at (Timestamp)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const H5PContent = sequelize.define('H5PContent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  json_data: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'h5p_content',
  timestamps: false,
});

module.exports = H5PContent;
