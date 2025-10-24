import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  login: (user, token, refreshToken) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, refreshToken, isAuthenticated: true });
  },
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    }
  },
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (token && refreshToken && userStr) {
      try {
        const response = await authService.verify();
        if (response.data.valid) {
          const user = response.data.user;
          localStorage.setItem('user', JSON.stringify(user));
          set({ user, token, refreshToken, isAuthenticated: true });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        }
      } catch (error) {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (storedRefreshToken) {
          try {
            const refreshResponse = await authService.refresh(storedRefreshToken);
            const { token: newToken, refreshToken: newRefreshToken, user } = refreshResponse.data;
            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token: newToken, refreshToken: newRefreshToken, isAuthenticated: true });
          } catch (refreshError) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        }
      }
    }
  },
  verifySession: async () => {
    try {
      const response = await authService.verify();
      if (response.data.valid) {
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      return false;
    }
  },
  restoreSession: async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await authService.refresh(refreshToken);
      const { token, refreshToken: newRefreshToken, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, refreshToken: newRefreshToken, isAuthenticated: true });
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      return false;
    }
  },
}));
