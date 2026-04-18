import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {
  listChats: () => api.get('/api/chats'),
  getChat: (chatId: string) => api.get(`/api/chats/${chatId}`),
  createChat: (data: { name: string; chat_type: string; model_name: string }) =>
    api.post('/api/chats', data),
  deleteChat: (chatId: string) => api.delete(`/api/chats/${chatId}`),
  sendMessage: (chatId: string, content: string) =>
    api.post(`/api/chats/${chatId}/messages`, { content, role: 'user' }),
  uploadFiles: (chatId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post(`/api/chats/${chatId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  executeCode: (chatId: string, code: string) =>
    api.post(`/api/chats/${chatId}/code`, { code }),
};

export const reportApi = {
  listReports: () => api.get('/api/reports'),
  createReport: (data: { title: string; format: string; content: string; chat_id?: string }) =>
    api.post('/api/reports', data),
  downloadReport: (reportId: string) =>
    api.get(`/api/reports/${reportId}/download`, { responseType: 'blob' }),
};

export const modelsApi = {
  listModels: () => api.get('/api/models'),
  pullModel: (modelName: string) =>
    api.post(`/api/models/pull?model_name=${modelName}`, null, {
      responseType: 'stream',
    }),
};

export default api;
