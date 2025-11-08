import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/connexion';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken, user } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/connexion';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/auth/logout', { refreshToken });
  },
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  verify: () => api.get('/auth/verify'),
  getSessions: () => api.get('/auth/sessions'),
  endSession: (sessionId: string) => api.post(`/auth/sessions/end/${sessionId}`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getChartData: (type: string, period?: string) =>
    api.get(`/dashboard/charts/${type}`, { params: { period } }),
};

export const categoriesService = {
  getAll: () => api.get('/categories'),
  getOne: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const articlesService = {
  getAll: (params?: any) => api.get('/articles', { params }),
  getOne: (id: string) => api.get(`/articles/${id}`),
  create: (data: any) => api.post('/articles', data),
  update: (id: string, data: any) => api.put(`/articles/${id}`, data),
  delete: (id: string) => api.delete(`/articles/${id}`),
};

export const stocksService = {
  getAll: (params?: any) => api.get('/articles', { params }),
  getOne: (id: string) => api.get(`/articles/${id}`),
  create: (data: any) => api.post('/articles', data),
  update: (id: string, data: any) => api.put(`/articles/${id}`, data),
  delete: (id: string) => api.delete(`/articles/${id}`),
  getStats: () => api.get('/articles/stats'),
};

export const mouvementsService = {
  getAll: (params?: any) => api.get('/mouvements', { params }),
  getOne: (id: string) => api.get(`/mouvements/${id}`),
  create: (data: any) => api.post('/mouvements', data),
  update: (id: string, data: any) => api.put(`/mouvements/${id}`, data),
  delete: (id: string) => api.delete(`/mouvements/${id}`),
  getStats: () => api.get('/mouvements/stats'),
};

export const commandesService = {
  getAll: (params?: any) => api.get('/commandes', { params }),
  getOne: (id: string) => api.get(`/commandes/${id}`),
  create: (data: any) => api.post('/commandes', data),
  update: (id: string, data: any) => api.put(`/commandes/${id}`, data),
  updateStatus: (id: string, statut: string) => api.put(`/commandes/${id}`, { statut }),
  delete: (id: string) => api.delete(`/commandes/${id}`),
  getStats: () => api.get('/commandes/stats'),
};

export const rapportsService = {
  getAll: (params?: any) => api.get('/rapports', { params }),
  getResume: (params?: any) => api.get('/rapports/resume', { params }),
  getByCategorie: (type: string, params?: any) =>
    api.get(`/rapports/categorie/${type}`, { params }),
  exportPDF: (params?: any) =>
    api.get('/rapports/export', { params, responseType: 'blob' }),
  getProductions: (params?: any) => api.get('/rapports/productions', { params }),
  getLivraisons: (params?: any) => api.get('/rapports/livraisons', { params }),
};

export const usersService = {
  getAll: () => api.get('/users'),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const pdfService = {
  generateReport: (type: string, data: any[], filters?: any) => {
    return api.post('/pdf/generate-rapport', {
      type,
      data,
      filters
    });
  },
  
  downloadReport: (filename: string) => {
    return api.get(`/pdf/download/${filename}`, {
      responseType: 'blob'
    });
  },
  
  listReports: () => {
    return api.get('/pdf/list');
  },
  
  // Nouveaux services pour exports spécifiques
  generateStocksReport: (filters?: any) => {
    return api.post('/pdf/stocks', { filters }, { responseType: 'blob' });
  },
  
  generateMouvementsReport: (filters?: any) => {
    return api.post('/pdf/mouvements', { filters }, { responseType: 'blob' });
  },
  
  generateCommandesReport: (filters?: any) => {
    return api.post('/pdf/commandes', { filters }, { responseType: 'blob' });
  }
};

export const historiqueService = {
  getAll: (params?: any) => api.get('/historique', { params }),
  getFiltered: (params?: any) => api.get('/historique/filter', { params }),
  getPeriode: (params?: any) => api.get('/historique/periode', { params }),
  create: (data: any) => api.post('/historique', data),
};

export const fournisseursService = {
   getAll: () => api.get('/fournisseurs'),
   getOne: (id: string) => api.get(`/fournisseurs/${id}`),
   create: (data: any) => api.post('/fournisseurs', data),
   update: (id: string, data: any) => api.put(`/fournisseurs/${id}`, data),
   delete: (id: string) => api.delete(`/fournisseurs/${id}`),
 };

export const clientsService = {
   getAll: () => api.get('/clients'),
   getOne: (id: string) => api.get(`/clients/${id}`),
   create: (data: any) => api.post('/clients', data),
   update: (id: string, data: any) => api.put(`/clients/${id}`, data),
   delete: (id: string) => api.delete(`/clients/${id}`),
 };

export default api;
