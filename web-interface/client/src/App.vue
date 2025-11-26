<template>
  <a-config-provider :theme="themeConfig">
    <a-layout class="app-layout">
      <a-layout-header class="header">
        <div class="header-content">
          <div class="logo">
            <VideoCameraOutlined class="logo-icon" />
            <span class="logo-text">Code2Video</span>
          </div>
          <a-menu
            v-model:selectedKeys="selectedKeys"
            mode="horizontal"
            :style="{ flex: 'auto', minWidth: 0, borderBottom: 'none' }"
          >
            <a-menu-item key="generate">
              <PlayCircleOutlined />
              生成视频
            </a-menu-item>
            <a-menu-item key="jobs">
              <UnorderedListOutlined />
              任务列表
            </a-menu-item>
            <a-menu-item key="videos">
              <FolderOutlined />
              视频库
            </a-menu-item>
          </a-menu>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <div class="content-wrapper">
          <!-- Generate Video Tab -->
          <div v-show="selectedKeys[0] === 'generate'" class="tab-content">
            <GenerateForm @video-generated="handleVideoGenerated" />
          </div>

          <!-- Jobs Tab -->
          <div v-show="selectedKeys[0] === 'jobs'" class="tab-content">
            <JobsList :refresh-trigger="jobsRefreshTrigger" />
          </div>

          <!-- Videos Tab -->
          <div v-show="selectedKeys[0] === 'videos'" class="tab-content">
            <VideosList />
          </div>
        </div>
      </a-layout-content>
      <a-layout-footer class="footer">
        <div class="footer-content">
          Code2Video Web Interface ©2025 | 
          <a href="https://github.com/showlab/Code2Video" target="_blank">
            <GithubOutlined /> GitHub
          </a>
        </div>
      </a-layout-footer>
    </a-layout>
  </a-config-provider>
</template>

<script setup>
/**
 * Code2Video Web 界面主应用组件
 * 管理整体布局和标签页切换
 */

import { ref } from 'vue';
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  UnorderedListOutlined,
  FolderOutlined,
  GithubOutlined,
} from '@ant-design/icons-vue';
import GenerateForm from './components/GenerateForm.vue';
import JobsList from './components/JobsList.vue';
import VideosList from './components/VideosList.vue';

// 响应式数据
const selectedKeys = ref(['generate']); // 当前选中的标签页
const jobsRefreshTrigger = ref(0); // 任务列表刷新触发器

// Ant Design 主题配置
const themeConfig = {
  token: {
    colorPrimary: '#1890ff', // 主题色
  },
};

/**
 * 处理视频生成完成事件
 * 切换到任务列表标签页并触发刷新
 */
const handleVideoGenerated = () => {
  selectedKeys.value = ['jobs']; // 切换到任务列表标签
  jobsRefreshTrigger.value++; // 触发任务列表刷新
};
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.header {
  background: #001529;
  padding: 0 50px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
  white-space: nowrap;
}

.logo-icon {
  font-size: 24px;
  margin-right: 8px;
}

.logo-text {
  background: linear-gradient(120deg, #1890ff, #36cfc9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.ant-menu-horizontal) {
  background: transparent;
  border: none;
}

:deep(.ant-menu-horizontal .ant-menu-item) {
  color: rgba(255, 255, 255, 0.65);
}

:deep(.ant-menu-horizontal .ant-menu-item-selected) {
  color: #fff;
  border-bottom-color: #1890ff;
}

:deep(.ant-menu-horizontal .ant-menu-item:hover) {
  color: #fff;
}

.content {
  padding: 24px 50px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px - 70px);
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.footer {
  text-align: center;
  background: #001529;
  color: rgba(255, 255, 255, 0.65);
}

.footer-content a {
  color: rgba(255, 255, 255, 0.65);
  margin-left: 8px;
  transition: color 0.3s;
}

.footer-content a:hover {
  color: #1890ff;
}
</style>
