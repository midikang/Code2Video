/**
 * API 客户端模块
 * 封装了所有与后端服务器的 HTTP 通信
 */

import axios from 'axios';

// API 基础 URL - 从环境变量获取或使用默认值
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 创建 axios 实例并配置
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 请求超时时间：30秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== 视频生成相关 ====================

/**
 * 创建新的视频生成任务
 * @param {string} knowledgePoint - 知识点描述
 * @param {boolean} useFeedback - 是否使用视觉反馈优化
 * @param {boolean} useAssets - 是否使用外部素材
 * @returns {Promise} 返回包含 jobId 的响应
 */
export const generateVideo = (knowledgePoint, useFeedback = true, useAssets = true) => {
  return api.post('/generate', {
    knowledgePoint,
    useFeedback,
    useAssets,
  });
};

// ==================== 任务管理相关 ====================

/**
 * 获取所有任务列表
 * @returns {Promise} 返回任务数组
 */
export const getJobs = () => {
  return api.get('/jobs');
};

/**
 * 获取特定任务的详细信息
 * @param {string} jobId - 任务ID
 * @returns {Promise} 返回任务详情（包括执行日志）
 */
export const getJob = (jobId) => {
  return api.get(`/jobs/${jobId}`);
};

/**
 * 删除指定任务
 * @param {string} jobId - 任务ID
 * @returns {Promise} 返回删除结果
 */
export const deleteJob = (jobId) => {
  return api.delete(`/jobs/${jobId}`);
};

// ==================== 视频管理相关 ====================

/**
 * 获取所有已生成的视频列表
 * @returns {Promise} 返回视频数组
 */
export const getVideos = () => {
  return api.get('/videos');
};

// ==================== 其他 ====================

/**
 * 健康检查 - 检查服务器是否正常运行
 * @returns {Promise} 返回服务器状态
 */
export const healthCheck = () => {
  return api.get('/health');
};

export default api;
