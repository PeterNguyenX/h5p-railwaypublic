/**
 * AI Injection Service
 * Takes accepted AI suggestions and creates H5P content via a single batched DB write.
 */

const { H5P_TYPE_MAP } = require('./aiService');

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

function buildTitle(suggestion) {
  const typeLabels = {
    MultiChoice: 'Multiple Choice',
    TrueFalse: 'True/False',
    FillBlanks: 'Fill in the Blanks',
    DragText: 'Drag Text',
    MarkWords: 'Mark Words',
    Matching: 'Matching',
  };
  const minutes = Math.floor(suggestion.timestamp / 60);
  const seconds = Math.floor(suggestion.timestamp % 60);
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const typeLabel = typeLabels[suggestion.type] || suggestion.type;
  return `${typeLabel} @ ${timeStr}`;
}

/**
 * Inject all accepted suggestions in a single DB write instead of N sequential writes.
 */
async function injectAll(suggestions, videoId, userId) {
  const { Video } = require('../models');

  const video = await Video.findOne({ where: { id: videoId, userId } });
  if (!video) throw new Error('Video not found or access denied');

  const videoDuration = video.duration;
  const h5pContent = Array.isArray(video.h5pContent) ? [...video.h5pContent] : [];

  const injected = [];
  const errors = [];

  for (const suggestion of suggestions) {
    if (videoDuration && suggestion.timestamp >= videoDuration - 1) {
      console.warn(`[Inject] Skipping ${suggestion.timestamp}s — exceeds duration ${videoDuration}s`);
      continue;
    }
    try {
      const contentData = buildContentData(suggestion);
      const contentId = `h5p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const content = {
        id: contentId,
        library: contentData.library,
        params: contentData.params,
        metadata: contentData.metadata,
        timestamp: suggestion.timestamp,
        status: 'active',
      };
      h5pContent.push(content);
      injected.push({
        suggestionId: suggestion.id,
        contentId,
        timestamp: suggestion.timestamp,
        type: suggestion.type,
        library: contentData.library,
      });
    } catch (error) {
      errors.push({ suggestionId: suggestion.id, error: error.message });
    }
  }

  // Re-attach the ScoreReview if it was present (AI must not remove it)
  const reviewItem = (Array.isArray(video.h5pContent) ? video.h5pContent : [])
    .find(c => c?.metadata?.systemType === 'finishing-score-review');
  if (reviewItem && !h5pContent.some(c => c?.metadata?.systemType === 'finishing-score-review')) {
    h5pContent.push(reviewItem);
  }

  // Single DB write for all interactions
  await video.update({ h5pContent });

  return {
    injected,
    errors,
    video: {
      id: video.id,
      title: video.title,
      h5pContent,
    },
  };
}

module.exports = { injectAll, buildContentData, buildTitle };
