import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Video generation
export const generateVideo = (knowledgePoint, useFeedback = true, useAssets = true) => {
  return api.post('/generate', {
    knowledgePoint,
    useFeedback,
    useAssets,
  });
};

// Jobs
export const getJobs = () => {
  return api.get('/jobs');
};

export const getJob = (jobId) => {
  return api.get(`/jobs/${jobId}`);
};

export const deleteJob = (jobId) => {
  return api.delete(`/jobs/${jobId}`);
};

// Videos
export const getVideos = () => {
  return api.get('/videos');
};

// Health check
export const healthCheck = () => {
  return api.get('/health');
};

export default api;
