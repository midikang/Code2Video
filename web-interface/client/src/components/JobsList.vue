<template>
  <a-card title="任务列表" class="jobs-card">
    <template #extra>
      <a-button @click="loadJobs" :loading="loading">
        <template #icon>
          <ReloadOutlined />
        </template>
        刷新
      </a-button>
    </template>

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && jobs.length === 0" description="暂无任务" />
      
      <a-list
        v-else
        :data-source="jobs"
        :pagination="{ pageSize: 10 }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-button
                size="small"
                @click="viewJobDetails(item)"
                :disabled="item.status === 'queued'"
              >
                详情
              </a-button>
              <a-popconfirm
                title="确认删除此任务?"
                ok-text="确认"
                cancel-text="取消"
                @confirm="deleteJobHandler(item.id)"
              >
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </template>

            <a-list-item-meta>
              <template #title>
                <div class="job-title">
                  {{ item.knowledgePoint }}
                  <a-tag :color="getStatusColor(item.status)" class="status-tag">
                    {{ getStatusText(item.status) }}
                  </a-tag>
                </div>
              </template>
              <template #description>
                <div class="job-meta">
                  <div>
                    <ClockCircleOutlined />
                    创建于: {{ formatDate(item.createdAt) }}
                  </div>
                  <div v-if="item.completedAt">
                    <CheckCircleOutlined />
                    完成于: {{ formatDate(item.completedAt) }}
                  </div>
                  <div v-if="item.error" class="error-msg">
                    <ExclamationCircleOutlined />
                    错误: {{ item.error }}
                  </div>
                </div>
              </template>
            </a-list-item-meta>

            <template v-if="item.status === 'running'">
              <a-progress :percent="50" status="active" :show-info="false" />
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-spin>

    <!-- Job Details Modal -->
    <a-modal
      v-model:open="detailsVisible"
      title="任务详情"
      :footer="null"
      width="800px"
      :body-style="{ maxHeight: '600px', overflow: 'auto' }"
    >
      <div v-if="selectedJob">
        <a-descriptions bordered :column="1">
          <a-descriptions-item label="知识点">
            {{ selectedJob.knowledgePoint }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(selectedJob.status)">
              {{ getStatusText(selectedJob.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDate(selectedJob.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item v-if="selectedJob.completedAt" label="完成时间">
            {{ formatDate(selectedJob.completedAt) }}
          </a-descriptions-item>
          <a-descriptions-item v-if="selectedJob.outputDir" label="输出目录">
            {{ selectedJob.outputDir }}
          </a-descriptions-item>
        </a-descriptions>

        <div v-if="selectedJob.output && selectedJob.output.length > 0" style="margin-top: 16px">
          <h4>执行日志:</h4>
          <div class="log-container">
            <div
              v-for="(log, index) in selectedJob.output"
              :key="index"
              :class="['log-entry', `log-${log.type}`]"
            >
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <pre>{{ log.text }}</pre>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import {
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { getJobs, getJob, deleteJob } from '../api';

const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0,
  },
});

const loading = ref(false);
const jobs = ref([]);
const detailsVisible = ref(false);
const selectedJob = ref(null);

const loadJobs = async () => {
  try {
    loading.value = true;
    const response = await getJobs();
    jobs.value = response.data.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  } catch (err) {
    console.error('Error loading jobs:', err);
    message.error('加载任务列表失败');
  } finally {
    loading.value = false;
  }
};

const viewJobDetails = async (job) => {
  try {
    const response = await getJob(job.id);
    selectedJob.value = response.data;
    detailsVisible.value = true;
  } catch (err) {
    console.error('Error loading job details:', err);
    message.error('加载任务详情失败');
  }
};

const deleteJobHandler = async (jobId) => {
  try {
    await deleteJob(jobId);
    message.success('任务已删除');
    loadJobs();
  } catch (err) {
    console.error('Error deleting job:', err);
    message.error('删除任务失败');
  }
};

const getStatusColor = (status) => {
  const colors = {
    queued: 'default',
    running: 'processing',
    completed: 'success',
    failed: 'error',
  };
  return colors[status] || 'default';
};

const getStatusText = (status) => {
  const texts = {
    queued: '排队中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
  };
  return texts[status] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN');
};

onMounted(() => {
  loadJobs();
  // Auto refresh every 5 seconds for running jobs
  const interval = setInterval(() => {
    if (jobs.value.some(job => job.status === 'running')) {
      loadJobs();
    }
  }, 5000);
  
  // Cleanup on unmount
  return () => clearInterval(interval);
});

watch(() => props.refreshTrigger, () => {
  loadJobs();
});
</script>

<style scoped>
.jobs-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.job-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  margin-left: 8px;
}

.job-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
}

.job-meta > div {
  display: flex;
  align-items: center;
  gap: 4px;
}

.error-msg {
  color: #ff4d4f;
}

.log-container {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.log-entry {
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-entry pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-time {
  color: #999;
  margin-right: 8px;
}

.log-stderr {
  color: #ff4d4f;
}

.log-stdout {
  color: #000;
}
</style>
