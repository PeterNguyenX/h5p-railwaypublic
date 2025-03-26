import { makeAutoObservable, runInAction } from 'mobx';
import authStore from './authStore';

export interface Video {
  id: string;
  title: string;
  description: string;
  filePath: string;
  thumbnailPath: string;
  userId: string;
  status: string;
  duration: string;
  createdAt: string;
  updatedAt: string;
  h5pContent?: any;
  metadata?: any;
}

class VideoStore {
  videos: Video[] = [];
  loading = false;
  error: string | null = null;
  totalVideos: number = 0;
  processingVideos: number = 0;
  completedVideos: number = 0;
  recentVideos: Video[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setLoading(loading: boolean) {
    runInAction(() => {
      this.loading = loading;
    });
  }

  setError(error: string | null) {
    runInAction(() => {
      this.error = error;
    });
  }

  setVideos(videos: Video[]) {
    runInAction(() => {
      this.videos = videos;
      this.updateStats();
    });
  }

  updateStats() {
    runInAction(() => {
      this.totalVideos = this.videos.length;
      this.processingVideos = this.videos.filter(v => v.status === 'processing').length;
      this.completedVideos = this.videos.filter(v => v.status === 'completed').length;
      this.recentVideos = [...this.videos]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6);
    });
  }

  async fetchVideos() {
    try {
      this.setLoading(true);
      this.setError(null);
      const token = authStore.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:3001/api/videos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      this.setVideos(data);
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'An error occurred while fetching videos');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async uploadVideo(formData: FormData, onProgress?: (progress: number) => void) {
    try {
      this.setLoading(true);
      this.setError(null);
      const token = authStore.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:3001/api/videos/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to upload video');
      }

      const data = await response.json();
      runInAction(() => {
        this.videos.unshift(data);
        this.updateStats();
      });
      return data;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'An error occurred while uploading video');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteVideo(videoId: string) {
    try {
      this.setLoading(true);
      this.setError(null);
      const token = authStore.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:3001/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to delete video');
      }

      runInAction(() => {
        this.videos = this.videos.filter(v => v.id !== videoId);
        this.updateStats();
      });
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'An error occurred while deleting video');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async updateVideo(videoId: string, updates: Partial<Video>) {
    try {
      this.setLoading(true);
      this.setError(null);
      const token = authStore.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:3001/api/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to update video');
      }

      const updatedVideo = await response.json();
      runInAction(() => {
        this.videos = this.videos.map(v => v.id === videoId ? updatedVideo : v);
        this.updateStats();
      });
      return updatedVideo;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'An error occurred while updating video');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }
}

export default new VideoStore(); 