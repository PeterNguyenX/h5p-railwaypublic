/**
 * AI Injection Service
 * Takes accepted AI suggestions and creates H5P content via the existing h5pService.
 */

const h5pService = require('./h5pService');
const { H5P_TYPE_MAP } = require('./aiService');

/**
 * Build H5P contentData from an AI suggestion.
 * Maps the AI-generated config to the format expected by h5pService.createTimeBasedContent.
 * @param {object} suggestion
 * @returns {object} contentData for h5pService
 */
function buildContentData(suggestion) {
  const library = suggestion.h5pLibrary || H5P_TYPE_MAP[suggestion.type];
  if (!library) {
    throw new Error(`Unknown H5P type: "${suggestion.type}"`);
  }

  return {
    library,
    params: suggestion.config || {},
    metadata: {
      title: buildTitle(suggestion),
      license: 'U'
    }
  };
}

/**
 * Generate a human-readable title for the H5P content.
 * @param {object} suggestion
 * @returns {string}
 */
function buildTitle(suggestion) {
  const typeLabels = {
    MultiChoice: 'Multiple Choice',
    TrueFalse: 'True/False',
    FillBlanks: 'Fill in the Blanks',
    Hotspot: 'Hotspot',
    DragDrop: 'Drag and Drop'
  };

  const minutes = Math.floor(suggestion.timestamp / 60);
  const seconds = Math.floor(suggestion.timestamp % 60);
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const typeLabel = typeLabels[suggestion.type] || suggestion.type;

  return `${typeLabel} @ ${timeStr}`;
}

/**
 * Inject a single accepted suggestion into the H5P service.
 * @param {object} suggestion - An accepted AI suggestion
 * @param {string} videoId - The video UUID
 * @returns {Promise<object>} The created H5P content
 */
async function injectSuggestion(suggestion, videoId) {
  const contentData = buildContentData(suggestion);
  const content = await h5pService.createTimeBasedContent(
    contentData,
    videoId,
    suggestion.timestamp
  );
  return content;
}

/**
 * Inject multiple accepted suggestions into the H5P service and update the Video model.
 * @param {object[]} suggestions - Array of accepted suggestions
 * @param {string} videoId - The video UUID
 * @param {string} userId - The requesting user's UUID (for ownership check)
 * @returns {Promise<{ injected: object[], video: object }>}
 */
async function injectAll(suggestions, videoId, userId) {
  const { Video } = require('../models');

  // Verify video ownership
  const video = await Video.findOne({
    where: { id: videoId, userId }
  });

  if (!video) {
    throw new Error('Video not found or access denied');
  }

  const injected = [];
  const errors = [];

  for (const suggestion of suggestions) {
    try {
      const content = await injectSuggestion(suggestion, videoId);
      // h5pService.createTimeBasedContent already persisted to DB; just record result
      injected.push({
        suggestionId: suggestion.id,
        contentId: content.id,
        timestamp: suggestion.timestamp,
        type: suggestion.type,
        library: content.library
      });
    } catch (error) {
      errors.push({
        suggestionId: suggestion.id,
        error: error.message
      });
    }
  }

  // Reload and return the updated video
  const updatedVideo = await Video.findByPk(videoId);

  return {
    injected,
    errors,
    video: {
      id: updatedVideo.id,
      title: updatedVideo.title,
      h5pContent: updatedVideo.h5pContent
    }
  };
}

module.exports = {
  injectSuggestion,
  injectAll,
  buildContentData,
  buildTitle
};
