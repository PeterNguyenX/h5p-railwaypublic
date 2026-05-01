const { LoginAttempt, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Log a login attempt
 */
const logLoginAttempt = async (email, username, ipAddress, success, failureReason = null, userAgent = null, userId = null) => {
  try {
    await LoginAttempt.create({
      userId,
      email,
      username,
      ipAddress,
      success,
      failureReason,
      userAgent
    });
  } catch (error) {
    logger.error('Failed to log login attempt', { error: error.message });
  }
};

/**
 * Check for suspicious login activity
 */
const checkSuspiciousActivity = async (email, ipAddress) => {
  try {
    const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000);
    
    // Check failed attempts
    const failedAttempts = await LoginAttempt.count({
      where: {
        email,
        success: false,
        timestamp: { [require('sequelize').Op.gt]: ONE_HOUR_AGO }
      }
    });

    // Check if too many failed attempts from same IP
    const ipFailedAttempts = await LoginAttempt.count({
      where: {
        ipAddress,
        success: false,
        timestamp: { [require('sequelize').Op.gt]: ONE_HOUR_AGO }
      }
    });

    return {
      suspicious: failedAttempts > 5 || ipFailedAttempts > 10,
      failedAttempts,
      ipFailedAttempts
    };
  } catch (error) {
    logger.error('Failed to check suspicious activity', { error: error.message });
    return { suspicious: false, failedAttempts: 0, ipFailedAttempts: 0 };
  }
};

module.exports = {
  logLoginAttempt,
  checkSuspiciousActivity
};
