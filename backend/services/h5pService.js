const path = require('path');
const fs = require('fs-extra');

class H5PService {
  constructor() {
    this.initialized = false;
    this.contentStorage = new Map(); // In-memory storage for demo
    console.log('Initializing H5P service with enhanced capabilities');
  }

  async initialize() {
    try {
      // Create directories if they don't exist
      const librariesPath = path.resolve('h5p-libraries');
      const contentPath = path.resolve('h5p-content'); 
      const temporaryStoragePath = path.resolve('h5p-temp');
      
      await fs.ensureDir(librariesPath);
      await fs.ensureDir(contentPath);
      await fs.ensureDir(temporaryStoragePath);

      this.initialized = true;
      console.log('H5P service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize H5P service:', error);
      throw error;
    }
  }

  async createTimeBasedContent(contentData, videoId, timestamp) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const { Video } = require('../models');
      const video = await Video.findByPk(videoId);
      if (!video) throw new Error('Video not found');

      const contentId = `h5p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const content = {
        id: contentId,
        library: contentData.library,
        params: contentData.params || {},
        metadata: contentData.metadata || { title: 'H5P Content', license: 'U' },
        timestamp,
        status: 'active'
      };

      // Persist full content object to DB
      const h5pContent = Array.isArray(video.h5pContent) ? [...video.h5pContent] : [];
      h5pContent.push(content);
      await video.update({ h5pContent });

      console.log('Created H5P content:', { contentId, videoId, timestamp, library: contentData.library });
      return content;
    } catch (error) {
      console.error('Error creating H5P content:', error);
      throw error;
    }
  }

  async updateTimeBasedContent(contentId, contentData, videoId, timestamp) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const existingContent = this.contentStorage.get(contentId);
      if (!existingContent) {
        throw new Error('Content not found');
      }

      const updatedContent = {
        ...existingContent,
        library: contentData.library,
        params: contentData.params,
        metadata: contentData.metadata || {},
        videoId,
        timestamp,
        updatedAt: new Date().toISOString()
      };

      this.contentStorage.set(contentId, updatedContent);

      console.log('Updated H5P content:', { contentId, contentData, videoId, timestamp });
      return {
        id: contentId,
        content: contentData,
        videoId,
        timestamp
      };
    } catch (error) {
      console.error('Error updating H5P content:', error);
      throw error;
    }
  }

  async updateContent(contentId, contentData, timestamp) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const { Video } = require('../models');
      const videos = await Video.findAll();

      for (const video of videos) {
        const h5pContent = Array.isArray(video.h5pContent) ? [...video.h5pContent] : [];
        const idx = h5pContent.findIndex(c => c.id === contentId);
        if (idx !== -1) {
          h5pContent[idx] = {
            ...h5pContent[idx],
            library: contentData.library,
            params: contentData.params || {},
            metadata: contentData.metadata || h5pContent[idx].metadata,
            ...(timestamp !== undefined ? { timestamp } : {}),
          };
          await video.update({ h5pContent });
          console.log('Updated H5P content:', contentId);
          return h5pContent[idx];
        }
      }

      throw new Error('Content not found');
    } catch (error) {
      console.error('Error updating H5P content:', error);
      throw error;
    }
  }

  async loadContent(contentId) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const content = this.contentStorage.get(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      console.log('Loading H5P content:', contentId);
      return {
        id: contentId,
        library: content.library,
        params: content.params,
        metadata: content.metadata,
        timestamp: content.timestamp,
        title: content.metadata?.title || 'H5P Content'
      };
    } catch (error) {
      console.error('Error loading H5P content:', error);
      throw error;
    }
  }

  async getVideoContent(videoId) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const { Video } = require('../models');
      const video = await Video.findByPk(videoId);

      if (!video) return [];

      const h5pContent = video.h5pContent;
      if (!Array.isArray(h5pContent)) return [];

      // Normalize Ollama-stored content (h5pLibrary → library, config → params)
      const valid = h5pContent
        .filter(c => c && c.id && (c.library || c.h5pLibrary))
        .map(c => ({
          ...c,
          library: c.library || c.h5pLibrary,
          params: c.params || c.config || {},
        }));
      console.log(`H5P content for video ${videoId}: ${valid.length} items`);
      return valid;
    } catch (error) {
      console.error('Error getting H5P content:', error);
      throw error;
    }
  }

  async deleteContent(contentId) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const { Video } = require('../models');
      const videos = await Video.findAll();

      for (const video of videos) {
        const h5pContent = Array.isArray(video.h5pContent) ? [...video.h5pContent] : [];
        const idx = h5pContent.findIndex(c => c.id === contentId);
        if (idx !== -1) {
          h5pContent.splice(idx, 1);
          await video.update({ h5pContent });
          console.log('Deleted H5P content:', contentId);
          return true;
        }
      }

      console.warn('Delete: content not found in DB:', contentId);
      return false;
    } catch (error) {
      console.error('Error deleting H5P content:', error);
      throw error;
    }
  }

  async getLibraries() {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      // Return a list of popular H5P content types
      return [
        {
          machineName: 'H5P.MultiChoice',
          title: 'Multiple Choice',
          majorVersion: 1,
          minorVersion: 16,
          description: 'Create flexible multiple choice questions'
        },
        {
          machineName: 'H5P.TrueFalse',
          title: 'True/False Question',
          majorVersion: 1,
          minorVersion: 6,
          description: 'Create True/False questions'
        },
        {
          machineName: 'H5P.Blanks',
          title: 'Fill in the Blanks',
          majorVersion: 1,
          minorVersion: 14,
          description: 'Create a task where users fill in the missing words'
        },
        {
          machineName: 'H5P.DragQuestion',
          title: 'Drag and Drop',
          majorVersion: 1,
          minorVersion: 14,
          description: 'Create drag and drop tasks with images'
        },
        {
          machineName: 'H5P.InteractiveVideo',
          title: 'Interactive Video',
          majorVersion: 1,
          minorVersion: 24,
          description: 'Create videos enriched with interactions'
        },
        {
          machineName: 'H5P.Questionnaire',
          title: 'Questionnaire',
          majorVersion: 1,
          minorVersion: 3,
          description: 'Create a questionnaire to receive feedback'
        }
      ];
    } catch (error) {
      console.error('Error getting libraries:', error);
      throw error;
    }
  }

  async getEditorData(contentId = null) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const libraries = await this.getLibraries();
      
      let content = null;
      if (contentId && this.contentStorage.has(contentId)) {
        content = this.contentStorage.get(contentId);
      }

      return {
        libraries,
        content: content ? {
          library: content.library,
          params: content.params,
          metadata: content.metadata
        } : null,
        baseUrl: '/api/h5p',
        l10n: {
          H5P: {
            'advancedHelp': 'Include this script on your website if you want dynamic sizing of the embedded content',
            'author': 'Author',
            'by': 'by',
            'close': 'Close',
            'contentChanged': 'Content has changed',
            'copyrightInformation': 'Rights of use',
            'copyrights': 'Rights of use',
            'copyrightsDescription': 'View copyright information for this content.',
            'disableFullscreen': 'Disable fullscreen',
            'download': 'Download',
            'downloadDescription': 'Download this content as a H5P file.',
            'embed': 'Embed',
            'embedDescription': 'View the embed code for this content.',
            'fullscreen': 'Fullscreen',
            'h5pDescription': 'Visit H5P.org to check out more cool content.',
            'hideAdvanced': 'Hide advanced',
            'license': 'License',
            'noCopyrights': 'No copyright information available for this content.',
            'showAdvanced': 'Show advanced',
            'showLess': 'Show less',
            'showMore': 'Show more',
            'size': 'Size',
            'source': 'Source',
            'startingOver': 'You will be starting over.',
            'subLevel': 'Sublevel',
            'title': 'Title',
            'year': 'Year'
          }
        },
        assets: {},
        copyrightSemantics: [],
        metadataSemantics: []
      };
    } catch (error) {
      console.error('Error getting editor data:', error);
      throw error;
    }
  }

  async renderContent(contentId) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const content = this.contentStorage.get(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      return {
        id: contentId,
        library: content.library,
        params: content.params,
        metadata: content.metadata,
        scripts: ['/api/h5p/core/js/h5p.js'],
        styles: ['/api/h5p/core/styles/h5p.css']
      };
    } catch (error) {
      console.error('Error rendering content:', error);
      throw error;
    }
  }

  getH5PEditor() {
    return null; // For compatibility
  }

  getH5PPlayer() {
    return null; // For compatibility
  }

  async createH5PPackage(video, h5pContents) {
    if (!this.initialized) {
      throw new Error('H5P service not initialized');
    }

    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip();

      // Create h5p.json manifest
      const h5pManifest = {
        title: video.title || `Interactive Video ${video.id}`,
        language: 'en',
        mainLibrary: 'H5P.InteractiveVideo',
        embedTypes: ['div'],
        license: 'U',
        extraTitle: video.title || `Interactive Video ${video.id}`,
        preloadedDependencies: [
          {
            machineName: 'H5P.InteractiveVideo',
            majorVersion: 1,
            minorVersion: 24
          }
        ]
      };

      // Add h5p.json to zip
      zip.addFile('h5p.json', Buffer.from(JSON.stringify(h5pManifest, null, 2)));

      // Resolve video source for content.json
      const videoFilename = video.filePath ? path.basename(video.filePath) : 'video.mp4';
      const isYoutube = !!(video.youtubeUrl || video.youtubeId);
      const youtubeUrl = video.youtubeUrl || (video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : null);
      const videoFiles = isYoutube
        ? [{ path: youtubeUrl, mime: 'video/YouTube', copyright: { license: 'U' } }]
        : [{ path: `videos/${videoFilename}`, mime: 'video/mp4', copyright: { license: 'U' } }];

      // Create content.json with interactive video structure
      const contentJson = {
        interactiveVideo: {
          video: {
            startScreenOptions: {
              title: video.title || 'Interactive Video',
              hideStartTitle: false
            },
            textTracks: {
              videoTrack: [
                {
                  label: 'Video',
                  kind: 'subtitles',
                  srcLang: 'en'
                }
              ]
            },
            files: videoFiles
          },
          assets: {
            interactions: h5pContents
              .filter(content => content?.metadata?.systemInteraction !== true)
              .map((content, index) => ({
              x: 10 + (index * 10), // Distribute horizontally
              y: 10 + (index * 5),  // Distribute vertically  
              width: 10,
              height: 10,
              duration: {
                from: content.timestamp || 0,
                to: (content.timestamp || 0) + 10
              },
              pause: true,
              displayType: 'button',
              buttonOnMobile: false,
              adaptivity: {
                correct: {
                  allowOptOut: false,
                  message: ''
                },
                wrong: {
                  allowOptOut: false,
                  message: ''
                },
                requireCompletion: false
              },
              label: content.metadata?.title || `Interaction ${index + 1}`,
              action: {
                library: content.library,
                params: content.params,
                subContentId: content.id,
                metadata: content.metadata || {}
              }
            })),
            bookmarks: [],
            endscreens: []
          },
          summary: {
            task: {
              library: 'H5P.Summary 1.10',
              params: {
                intro: 'Choose the correct statement.',
                summaries: []
              },
              subContentId: 'summary'
            },
            displayAt: 3
          }
        }
      };

      // Add content/content.json to zip
      zip.addFile('content/content.json', Buffer.from(JSON.stringify(contentJson, null, 2)));

      // Bundle the local video file (skip for YouTube — URL is referenced directly)
      if (!isYoutube && video.filePath && await fs.pathExists(video.filePath)) {
        const videoBuffer = await fs.readFile(video.filePath);
        zip.addFile(`content/videos/${videoFilename}`, videoBuffer);
      }

      // Generate and return the zip buffer
      return zip.toBuffer();
    } catch (error) {
      console.error('Error creating H5P package:', error);
      throw error;
    }
  }
}

module.exports = new H5PService();
