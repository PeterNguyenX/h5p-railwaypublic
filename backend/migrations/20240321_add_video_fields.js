const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Videos', 'youtubeUrl', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Videos', 'youtubeId', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Videos', 'trimStart', {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('Videos', 'trimEnd', {
      type: DataTypes.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('Videos', 'captions', {
      type: DataTypes.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('Videos', 'ltiLink', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Videos', 'templateId', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Videos', 'language', {
      type: DataTypes.ENUM('en', 'vi'),
      defaultValue: 'en',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Videos', 'youtubeUrl');
    await queryInterface.removeColumn('Videos', 'youtubeId');
    await queryInterface.removeColumn('Videos', 'trimStart');
    await queryInterface.removeColumn('Videos', 'trimEnd');
    await queryInterface.removeColumn('Videos', 'captions');
    await queryInterface.removeColumn('Videos', 'ltiLink');
    await queryInterface.removeColumn('Videos', 'templateId');
    await queryInterface.removeColumn('Videos', 'language');
  }
}; 