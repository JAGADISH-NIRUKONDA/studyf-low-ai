import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor for 401s and standard error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('studyflow_token');
      localStorage.removeItem('studyflow_user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

export const subjectsAPI = {
  getAll: () => api.get('/subjects'),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.patch(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const topicsAPI = {
  getAll: (subjectId) => api.get('/topics', { params: { subject_id: subjectId } }),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.patch(`/topics/${id}`, data),
  toggle: (id) => api.patch(`/topics/${id}/toggle`),
  delete: (id) => api.delete(`/topics/${id}`),
};

export const tasksAPI = {
  getAll: (subjectId) => api.get('/tasks', { params: { subject_id: subjectId } }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  toggle: (id) => api.patch(`/tasks/${id}/toggle`),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.patch(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const plannerAPI = {
  getSessions: (params) => api.get('/planner', { params }),
  generate: (data) => api.post('/planner/generate', data),
  recalculate: (data) => api.post('/planner/recalculate', data),
  updateSession: (id, data) => api.patch(`/planner/study-sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/planner/study-sessions/${id}`),
};

export const quizzesAPI = {
  getQuestions: (params) => api.get('/quizzes/questions', { params }),
  submit: (data) => api.post('/quizzes/submit', data),
  getAttempts: (params) => api.get('/quizzes/attempts', { params }),
  getWeakTopics: () => api.get('/quizzes/weak-topics'),
};

export const careerAPI = {
  getProfile: () => api.get('/career/profile'),
  recommend: (data) => api.post('/career/recommend', data),
  getRecommendations: () => api.get('/career/recommendations'),
};

export const chatAPI = {
  getProviderInfo: () => api.get('/chat/provider-info'),
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (data) => api.post('/chat/conversations', data),
  getConversation: (id) => api.get(`/chat/conversations/${id}`),
  renameConversation: (id, data) => api.patch(`/chat/conversations/${id}`, data),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
  sendMessage: (id, data) => api.post(`/chat/conversations/${id}/messages`, data),
  convertToNote: (data) => api.post('/chat/convert-to-note', data),
};

export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics'),
  getExportUrl: () => '/api/analytics/export',
};

export default api;

