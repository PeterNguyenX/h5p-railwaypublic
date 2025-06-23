// LtiLink model
// Fields: id (UUID), project_id (UUID), token (String), created_at (Timestamp)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LtiLink = sequelize.define('LtiLink', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'lti_links',
  timestamps: false,
});

module.exports = LtiLink;
