const axios = require('axios');
const FormData = require('form-data');

class WordPressService {
  constructor(baseURL = 'http://localhost:8888/h5p-wp', username = '', password = '') {
    this.baseURL = baseURL;
    this.username = username;
    this.password = password;
    this.token = null;
  }

  /**
   * Authenticate with WordPress and get JWT token
   */
  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/wp-json/jwt-auth/v1/token`, {
        username: this.username,
        password: this.password
      });
      
      this.token = response.data.token;
      return this.token;
    } catch (error) {
      console.error('WordPress authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Get headers with authentication
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create a new WordPress post
   */
  async createPost(title, content, status = 'publish') {
    try {
      if (!this.token) {
        await this.authenticate();
      }

      const response = await axios.post(
        `${this.baseURL}/wp-json/wp/v2/posts`,
        {
          title,
          content,
          status
        },
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to create WordPress post:', error.message);
      throw error;
    }
  }

  /**
   * Get WordPress posts
   */
  async getPosts(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/wp-json/wp/v2/posts`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get WordPress posts:', error.message);
      throw error;
    }
  }

  /**
   * Create H5P content in WordPress
   */
  async createH5PContent(title, library, params) {
    try {
      if (!this.token) {
        await this.authenticate();
      }

      const h5pData = {
        title,
        library,
        params: JSON.stringify(params)
      };

      const response = await axios.post(
        `${this.baseURL}/wp-json/h5p/v1/content`,
        h5pData,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to create H5P content in WordPress:', error.message);
      throw error;
    }
  }

  /**
   * Get H5P content from WordPress
   */
  async getH5PContent(id = null) {
    try {
      const url = id 
        ? `${this.baseURL}/wp-json/h5p/v1/content/${id}`
        : `${this.baseURL}/wp-json/h5p/v1/content`;

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get H5P content from WordPress:', error.message);
      throw error;
    }
  }

  /**
   * Upload media to WordPress
   */
  async uploadMedia(filePath, fileName, mimeType) {
    try {
      if (!this.token) {
        await this.authenticate();
      }

      const formData = new FormData();
      formData.append('file', require('fs').createReadStream(filePath));
      
      const response = await axios.post(
        `${this.baseURL}/wp-json/wp/v2/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            ...formData.getHeaders()
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to upload media to WordPress:', error.message);
      throw error;
    }
  }

  /**
   * Sync H5P content between your app and WordPress
   */
  async syncH5PContent(localContent) {
    try {
      // Check if content exists in WordPress
      const wpContent = await this.getH5PContent();
      
      // Find matching content or create new
      const existingContent = wpContent.find(wp => wp.slug === localContent.slug);
      
      if (existingContent) {
        // Update existing content
        return await this.updateH5PContent(existingContent.id, localContent);
      } else {
        // Create new content
        return await this.createH5PContent(
          localContent.title,
          localContent.library,
          localContent.params
        );
      }
    } catch (error) {
      console.error('Failed to sync H5P content:', error.message);
      throw error;
    }
  }

  /**
   * Update H5P content in WordPress
   */
  async updateH5PContent(id, data) {
    try {
      if (!this.token) {
        await this.authenticate();
      }

      const response = await axios.put(
        `${this.baseURL}/wp-json/h5p/v1/content/${id}`,
        data,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to update H5P content in WordPress:', error.message);
      throw error;
    }
  }
}

module.exports = WordPressService;
