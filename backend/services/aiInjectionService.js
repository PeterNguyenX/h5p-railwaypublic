/**
 * AI Injection Service
 * Takes accepted AI suggestions and creates H5P content via a single batched DB write.
 */

const { H5P_TYPE_MAP } = require('./aiService');

/**
 * Turns a raw AI suggestion into the shape H5P expects for a content node.
 * Resolves the library name from the suggestion itself or falls back to H5P_TYPE_MAP.
 * 'params' holds the question config; 'metadata' has the auto-generated title
 * and license: 'U' (H5P code for "Undisclosed" — no copyright specified).
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
      license: 'U' // H5P "Undisclosed" — default when license doesn't matter
    }
  };
}

/**
 * Generates a human-readable title from a suggestion, e.g. "Multiple Choice @ 01:30".
 * Maps internal type keys (MultiChoice) to display names, then formats the
 * timestamp (seconds) as MM:SS. Falls back to the raw type key if not in the map.
 */
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
 * Injects all accepted AI suggestions into a video's H5P content in one DB write.
 *
 * Steps:
 * 1. Fetch the video and verify it belongs to the given user.
 * 2. Copy the existing h5pContent array.
 * 3. For each suggestion:
 *    - Skip if its timestamp is within 1s of the video end (avoids content at the last frame).
 *    - Build the H5P content object with a unique ID (h5p_<timestamp>_<random>).
 *    - Append to h5pContent; record success in injected[] or failure in errors[].
 * 4. Re-attach the ScoreReview item (systemType: 'finishing-score-review') if it was
 *    present before — this system item must always remain and must not be lost.
 * 5. Persist everything in a single video.update() call.
 * 6. Return { injected, errors, video } as a summary.
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
    // Skip suggestions whose timestamp falls in the last second of the video
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
