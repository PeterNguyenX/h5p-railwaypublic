const { ContentFlag, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Create a content flag (report)
 */
const createFlag = async (contentId, contentType, reason, description, reportedBy) => {
  try {
    const flag = await ContentFlag.create({
      contentId,
      contentType,
      reason,
      description,
      reportedBy,
      status: 'PENDING',
      flaggedAt: new Date()
    });
    return flag;
  } catch (error) {
    logger.error('Failed to create content flag', { error: error.message });
    throw error;
  }
};

/**
 * Get pending flags for review
 */
const getPendingFlags = async (limit = 50, offset = 0) => {
  try {
    const flags = await ContentFlag.findAndCountAll({
      where: { status: 'PENDING' },
      include: [
        { model: User, as: 'reportedByUser', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'reviewedByUser', attributes: ['id', 'username'] }
      ],
      order: [['flaggedAt', 'DESC']],
      limit,
      offset
    });
    return flags;
  } catch (error) {
    logger.error('Failed to get pending flags', { error: error.message });
    throw error;
  }
};

/**
 * Review and action a flag
 */
const reviewFlag = async (flagId, status, action, reviewNotes, reviewedBy) => {
  try {
    const flag = await ContentFlag.findByPk(flagId);
    if (!flag) throw new Error('Flag not found');

    await flag.update({
      status,
      action,
      reviewNotes,
      reviewedBy,
      reviewedAt: new Date()
    });

    return flag;
  } catch (error) {
    logger.error('Failed to review flag', { error: error.message });
    throw error;
  }
};

/**
 * Get flags for a specific content
 */
const getFlagsForContent = async (contentId) => {
  try {
    const flags = await ContentFlag.findAll({
      where: { contentId },
      include: [
        { model: User, as: 'reportedByUser', attributes: ['id', 'username'] }
      ],
      order: [['flaggedAt', 'DESC']]
    });
    return flags;
  } catch (error) {
    logger.error('Failed to get flags for content', { error: error.message });
    throw error;
  }
};

/**
 * Get moderation stats
 */
const getModerationStats = async () => {
  try {
    const stats = {
      pending: await ContentFlag.count({ where: { status: 'PENDING' } }),
      reviewed: await ContentFlag.count({ where: { status: 'REVIEWED' } }),
      approved: await ContentFlag.count({ where: { status: 'APPROVED' } }),
      rejected: await ContentFlag.count({ where: { status: 'REJECTED' } }),
      resolved: await ContentFlag.count({ where: { status: 'RESOLVED' } })
    };
    return stats;
  } catch (error) {
    logger.error('Failed to get moderation stats', { error: error.message });
    throw error;
  }
};

module.exports = {
  createFlag,
  getPendingFlags,
  reviewFlag,
  getFlagsForContent,
  getModerationStats
};
