<template>
  <a-card title="生成教学视频" class="generate-card">
    <a-form
      ref="formRef"
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
      @finish="handleSubmit"
    >
      <a-form-item
        label="知识点"
        name="knowledgePoint"
        :rules="[{ required: true, message: '请输入知识点!' }]"
      >
        <a-textarea
          v-model:value="formState.knowledgePoint"
          placeholder="例如: Linear transformations and matrices"
          :rows="4"
          :disabled="loading"
        />
        <div class="hint-text">
          输入您想要生成教学视频的知识点或主题
        </div>
      </a-form-item>

      <a-form-item label="使用反馈" name="useFeedback">
        <a-switch v-model:checked="formState.useFeedback" :disabled="loading" />
        <span class="switch-label">启用视觉反馈优化</span>
      </a-form-item>

      <a-form-item label="使用素材" name="useAssets">
        <a-switch v-model:checked="formState.useAssets" :disabled="loading" />
        <span class="switch-label">自动获取图标等视觉素材</span>
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
        <a-button
          type="primary"
          html-type="submit"
          :loading="loading"
          size="large"
          block
        >
          <template #icon>
            <PlayCircleOutlined />
          </template>
          {{ loading ? '生成中...' : '开始生成' }}
        </a-button>
      </a-form-item>
    </a-form>

    <a-alert
      v-if="error"
      :message="error"
      type="error"
      closable
      @close="error = null"
      style="margin-top: 16px"
    />

    <a-alert
      v-if="success"
      message="视频生成任务已创建"
      description="任务已加入队列,请在任务列表中查看进度"
      type="success"
      closable
      @close="success = false"
      style="margin-top: 16px"
    />
  </a-card>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { PlayCircleOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { generateVideo } from '../api';

const emit = defineEmits(['video-generated']);

const formRef = ref();
const loading = ref(false);
const error = ref(null);
const success = ref(false);

const formState = reactive({
  knowledgePoint: '',
  useFeedback: true,
  useAssets: true,
});

const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = null;
    success.value = false;

    const response = await generateVideo(
      formState.knowledgePoint,
      formState.useFeedback,
      formState.useAssets
    );

    if (response.data.jobId) {
      success.value = true;
      message.success('视频生成任务已创建');
      
      // Reset form
      formState.knowledgePoint = '';
      
      // Emit event to parent
      emit('video-generated', response.data);
    }
  } catch (err) {
    console.error('Error generating video:', err);
    error.value = err.response?.data?.error || err.message || '生成失败,请重试';
    message.error('视频生成失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.generate-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hint-text {
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.switch-label {
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.65);
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}
</style>
