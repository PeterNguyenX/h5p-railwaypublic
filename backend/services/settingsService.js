const { SystemSettings } = require('../models');
const logger = require('../utils/logger');

/**
 * Get a system setting
 */
const getSetting = async (key) => {
  try {
    const setting = await SystemSettings.findOne({ where: { key } });
    return setting?.value || null;
  } catch (error) {
    logger.error('Failed to get system setting', { error: error.message, key });
    return null;
  }
};

/**
 * Get all settings by category
 */
const getSettingsByCategory = async (category) => {
  try {
    const settings = await SystemSettings.findAll({ where: { category } });
    return settings;
  } catch (error) {
    logger.error('Failed to get settings by category', { error: error.message, category });
    return [];
  }
};

/**
 * Update a system setting
 */
const updateSetting = async (key, value, category = 'GENERAL', description = null, updatedBy = null) => {
  try {
    const [setting] = await SystemSettings.findOrCreate({
      where: { key },
      defaults: { value, category, description, updatedBy }
    });

    await setting.update({
      value,
      category,
      description,
      updatedBy,
      updatedAt: new Date()
    });

    return setting;
  } catch (error) {
    logger.error('Failed to update system setting', { error: error.message, key });
    throw error;
  }
};

/**
 * Get all settings
 */
const getAllSettings = async () => {
  try {
    const settings = await SystemSettings.findAll();
    return settings;
  } catch (error) {
    logger.error('Failed to get all settings', { error: error.message });
    return [];
  }
};

/**
 * Initialize default settings
 */
const initializeDefaults = async () => {
  const defaults = [
    {
      key: 'MAX_LOGIN_ATTEMPTS',
      value: 5,
      category: 'SECURITY',
      description: 'Maximum failed login attempts before lockout'
    },
    {
      key: 'LOCKOUT_DURATION_MINUTES',
      value: 30,
      category: 'SECURITY',
      description: 'Lockout duration in minutes'
    },
    {
      key: 'SESSION_TIMEOUT_MINUTES',
      value: 60,
      category: 'SECURITY',
      description: 'Session timeout in minutes'
    },
    {
      key: 'PASSWORD_MIN_LENGTH',
      value: 8,
      category: 'SECURITY',
      description: 'Minimum password length'
    },
    {
      key: 'ENABLE_EMAIL_VERIFICATION',
      value: false,
      category: 'FEATURES',
      description: 'Require email verification for new accounts'
    },
    {
      key: 'ENABLE_2FA',
      value: false,
      category: 'SECURITY',
      description: 'Enable two-factor authentication'
    },
    {
      key: 'MAX_UPLOAD_SIZE_MB',
      value: 500,
      category: 'SYSTEM',
      description: 'Maximum upload size in MB'
    },
    {
      key: 'MAINTENANCE_MODE',
      value: false,
      category: 'SYSTEM',
      description: 'Enable maintenance mode'
    }
  ];

  for (const defaultSetting of defaults) {
    try {
      const [setting, created] = await SystemSettings.findOrCreate({
        where: { key: defaultSetting.key },
        defaults: defaultSetting
      });
      if (!created && !setting.description) {
        await setting.update({ description: defaultSetting.description });
      }
    } catch (error) {
      logger.error('Failed to create default setting', { error: error.message, key: defaultSetting.key });
    }
  }
};

module.exports = {
  getSetting,
  getSettingsByCategory,
  updateSetting,
  getAllSettings,
  initializeDefaults
};
