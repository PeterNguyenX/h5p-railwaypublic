import { makeAutoObservable, runInAction } from 'mobx';

export interface User {
  id: string;
  username: string;
  email: string;
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
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch user data');
      }
      const user: User = await response.json();
      runInAction(() => {
        this.user = user;
        this.isAuthenticated = true;
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      this.logout();
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      this.setLoading(true);
      this.setError(null);
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.message || 'Login failed';
        
        if (response.status === 400) {
          if (data.missingFields) {
            const fields = Object.entries(data.missingFields)
              .filter(([_, missing]) => missing)
              .map(([field]) => field)
              .join(', ');
            errorMessage = `Missing required fields: ${fields}`;
          }
        } else if (response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      runInAction(() => {
        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        localStorage.setItem('token', data.token);
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Login failed';
      });
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async register(username: string, email: string, password: string) {
    try {
      this.setLoading(true);
      this.setError(null);
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.message || 'Registration failed';
        
        if (response.status === 400) {
          if (data.missingFields) {
            const fields = Object.entries(data.missingFields)
              .filter(([_, missing]) => missing)
              .map(([field]) => field)
              .join(', ');
            errorMessage = `Missing required fields: ${fields}`;
          }
        } else if (response.status === 409) {
          errorMessage = 'Email or username already exists';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      runInAction(() => {
        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        localStorage.setItem('token', data.token);
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Registration failed';
      });
      throw error;
    } finally {
      this.setLoading(false);
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

export default new AuthStore(); 