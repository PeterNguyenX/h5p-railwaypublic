const H5P = require('@h5p/nodejs-library');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

class H5PService {
  constructor() {
    this.h5p = new H5P({
      baseUrl: process.env.H5P_BASE_URL || 'http://localhost:3000',
      librariesPath: process.env.H5P_LIBRARY_PATH,
      temporaryStoragePath: process.env.H5P_TEMP_PATH,
      userDataPath: path.join(process.env.H5P_TEMP_PATH, 'userData'),
      contentTypeCachePath: path.join(process.env.H5P_TEMP_PATH, 'contentTypeCache'),
      logLevel: 'debug'
    });
  }

  async initialize() {
    try {
      await this.h5p.init();
      console.log('H5P initialized successfully');
    } catch (error) {
      console.error('Error initializing H5P:', error);
      throw error;
    }
  }

  async createContent(contentData, userId) {
    try {
      const content = await this.h5p.saveOrUpdateContent(
        null,
        contentData,
        userId
      );
      return content;
    } catch (error) {
      console.error('Error creating H5P content:', error);
      throw error;
    }
  }

  async updateContent(contentId, contentData, userId) {
    try {
      const content = await this.h5p.saveOrUpdateContent(
        contentId,
        contentData,
        userId
      );
      return content;
    } catch (error) {
      console.error('Error updating H5P content:', error);
      throw error;
    }
  }

  async getContent(contentId) {
    try {
      const content = await this.h5p.getContent(contentId);
      return content;
    } catch (error) {
      console.error('Error getting H5P content:', error);
      throw error;
    }
  }

  async deleteContent(contentId) {
    try {
      await this.h5p.deleteContent(contentId);
    } catch (error) {
      console.error('Error deleting H5P content:', error);
      throw error;
    }
  }

  async installLibrary(libraryData) {
    try {
      const library = await this.h5p.installLibrary(libraryData);
      return library;
    } catch (error) {
      console.error('Error installing H5P library:', error);
      throw error;
    }
  }

  async getLibraryInfo(machineName, majorVersion, minorVersion) {
    try {
      const library = await this.h5p.getLibraryInfo(
        machineName,
        majorVersion,
        minorVersion
      );
      return library;
    } catch (error) {
      console.error('Error getting library info:', error);
      throw error;
    }
  }

  async getLibraryList() {
    try {
      const libraries = await this.h5p.getLibraryList();
      return libraries;
    } catch (error) {
      console.error('Error getting library list:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      await this.h5p.cleanup();
    } catch (error) {
      console.error('Error cleaning up H5P:', error);
      throw error;
    }
  }
}

module.exports = new H5PService(); 