import { makeAutoObservable, runInAction } from 'mobx';
import api from '../config/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

class AuthStore {
  isAuthenticated = false;
  user: User | null = null;
  token: string | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.checkAuth();
  }

  private async checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      runInAction(() => {
        this.token = token;
      });
      try {
        await this.fetchUser();
      } catch (error) {
        console.error('Error checking auth:', error);
        this.logout();
      }
    }
  }

  private async fetchUser() {
    try {
      const response = await api.get<User>('/auth/me');
      runInAction(() => {
        this.user = response.data;
        this.isAuthenticated = true;
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      this.logout();
      throw error;
    }
  }

  async login(username: string, password: string) {
    try {
      this.setLoading(true);
      this.setError(null);
      const response = await api.post<AuthResponse>('/auth/login', { username, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      runInAction(() => {
        this.token = token;
        this.user = user;
        this.isAuthenticated = true;
      });
    } catch (error: any) {
      let errorMessage = 'Login failed';
      
      if (error.response) {
        const data = error.response.data;
        
        if (error.response.status === 400) {
          if (data.missingFields) {
            const fields = Object.entries(data.missingFields)
              .filter(([_, missing]) => missing)
              .map(([field]) => field)
              .join(', ');
            errorMessage = `Missing required fields: ${fields}`;
          }
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      
      runInAction(() => {
        this.error = errorMessage;
      });
      throw new Error(errorMessage);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async register(username: string, email: string, password: string) {
    try {
      this.setLoading(true);
      this.setError(null);
      const response = await api.post<AuthResponse>('/auth/register', { 
        username, 
        email, 
        password 
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      runInAction(() => {
        this.token = token;
        this.user = user;
        this.isAuthenticated = true;
      });
    } catch (error: any) {
      let errorMessage = 'Registration failed';
      
      if (error.response) {
        const data = error.response.data;
        
        if (error.response.status === 400) {
          if (data.missingFields) {
            const fields = Object.entries(data.missingFields)
              .filter(([_, missing]) => missing)
              .map(([field]) => field)
              .join(', ');
            errorMessage = `Missing required fields: ${fields}`;
          } else if (data.duplicateEmail) {
            errorMessage = 'Email already in use';
          } else if (data.duplicateUsername) {
            errorMessage = 'Username already in use';
          }
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      
      runInAction(() => {
        this.error = errorMessage;
      });
      throw new Error(errorMessage);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  logout() {
    runInAction(() => {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
    });
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

  getToken() {
    return this.token;
  }
}

// Create and export a singleton instance
const authStore = new AuthStore();
export default authStore; 