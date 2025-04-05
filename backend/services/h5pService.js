// Mock H5P service implementation
// This is a temporary solution until the actual H5P library is properly installed

class H5PService {
  constructor() {
    console.log('Using mock H5P service');
  }

  async initialize() {
    console.log('Mock H5P initialized');
    return Promise.resolve();
  }

  async createTimeBasedContent(contentData, videoId, timestamp) {
    console.log('Mock creating H5P content:', { contentData, videoId, timestamp });
    return {
      id: Date.now(),
      content: contentData,
      videoId,
      timestamp
    };
  }

  async updateTimeBasedContent(contentId, contentData, videoId, timestamp) {
    console.log('Mock updating H5P content:', { contentId, contentData, videoId, timestamp });
    return {
      id: contentId,
      content: contentData,
      videoId,
      timestamp
    };
  }

  async getVideoContent(videoId) {
    console.log('Mock getting H5P content for video:', videoId);
    return [];
  }

  async deleteContent(contentId) {
    console.log('Mock deleting H5P content:', contentId);
    return true;
  }

  async installLibrary(libraryData) {
    console.error('Mock H5P service does not support installing libraries');
    throw new Error('Mock H5P service does not support installing libraries');
  }

  async getLibraryInfo(machineName, majorVersion, minorVersion) {
    console.error('Mock H5P service does not support getting library info');
    throw new Error('Mock H5P service does not support getting library info');
  }

  async getLibraryList() {
    console.error('Mock H5P service does not support getting library list');
    throw new Error('Mock H5P service does not support getting library list');
  }

  async cleanup() {
    console.error('Mock H5P service does not support cleaning up');
    throw new Error('Mock H5P service does not support cleaning up');
  }
}

module.exports = new H5PService(); 