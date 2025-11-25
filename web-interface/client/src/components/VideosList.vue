<template>
  <a-card title="视频库" class="videos-card">
    <template #extra>
      <a-button @click="loadVideos" :loading="loading">
        <template #icon>
          <ReloadOutlined />
        </template>
        刷新
      </a-button>
    </template>

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && videos.length === 0" description="暂无视频" />
      
      <a-row :gutter="[16, 16]">
        <a-col
          v-for="video in videos"
          :key="video.path"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card
            hoverable
            class="video-card"
            @click="viewVideo(video)"
          >
            <template #cover>
              <div class="video-thumbnail">
                <VideoCameraOutlined class="video-icon" />
              </div>
            </template>
            <a-card-meta>
              <template #title>
                <div class="video-name" :title="video.name">
                  {{ video.name }}
                </div>
              </template>
              <template #description>
                <div class="video-info">
                  <div>文件夹: {{ video.folder }}</div>
                  <div>创建: {{ formatDate(video.createdAt) }}</div>
                </div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>

    <!-- Video Player Modal -->
    <a-modal
      v-model:open="playerVisible"
      :title="currentVideo?.name"
      :footer="null"
      width="900px"
      centered
    >
      <div v-if="currentVideo" class="video-player-container">
        <video
          :src="getVideoUrl(currentVideo.path)"
          controls
          class="video-player"
          autoplay
        >
          您的浏览器不支持视频播放
        </video>
        <a-descriptions bordered :column="2" style="margin-top: 16px">
          <a-descriptions-item label="文件名">
            {{ currentVideo.name }}
          </a-descriptions-item>
          <a-descriptions-item label="文件夹">
            {{ currentVideo.folder }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间" :span="2">
            {{ formatDate(currentVideo.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="视频路径" :span="2">
            {{ currentVideo.fullPath }}
          </a-descriptions-item>
        </a-descriptions>
        <div style="margin-top: 16px; text-align: right">
          <a-button
            type="primary"
            :href="getVideoUrl(currentVideo.path)"
            download
          >
            <template #icon>
              <DownloadOutlined />
            </template>
            下载视频
          </a-button>
        </div>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  ReloadOutlined,
  VideoCameraOutlined,
  DownloadOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { getVideos } from '../api';

const loading = ref(false);
const videos = ref([]);
const playerVisible = ref(false);
const currentVideo = ref(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE_URL.replace('/api', '');

const loadVideos = async () => {
  try {
    loading.value = true;
    const response = await getVideos();
    videos.value = response.data;
  } catch (err) {
    console.error('Error loading videos:', err);
    message.error('加载视频列表失败');
  } finally {
    loading.value = false;
  }
};

const viewVideo = (video) => {
  currentVideo.value = video;
  playerVisible.value = true;
};

const getVideoUrl = (path) => {
  return `${BASE_URL}${path}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

onMounted(() => {
  loadVideos();
});
</script>

<style scoped>
.videos-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-card {
  transition: all 0.3s;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.video-thumbnail {
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-icon {
  font-size: 64px;
  color: rgba(255, 255, 255, 0.8);
}

.video-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-info {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.video-info > div {
  margin-bottom: 4px;
}

.video-player-container {
  width: 100%;
}

.video-player {
  width: 100%;
  max-height: 500px;
  background: #000;
  border-radius: 4px;
}
</style>
