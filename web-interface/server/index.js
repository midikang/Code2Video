// Code2Video Web Interface 后端服务器
// 使用 Express.js 构建的 REST API 服务器，用于管理视频生成任务

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// 速率限制配置 - 防止 API 滥用
// 通用限制器：每15分钟最多100个请求
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟时间窗口
  max: 100, // 每个IP最多100个请求
  message: 'Too many requests from this IP, please try again later.',
});

// 视频生成限制器：每小时最多10个视频生成请求
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时时间窗口
  max: 10, // 每小时最多10个视频生成请求
  message: 'Too many video generation requests, please try again later.',
});

// 中间件配置
app.use(cors()); // 启用跨域资源共享
app.use(bodyParser.json()); // 解析 JSON 请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析 URL 编码的请求体
app.use('/api/', limiter); // 对所有 API 路由应用速率限制

// 存储视频生成任务的内存映射
// key: jobId (UUID), value: 任务对象
const jobs = new Map();

// 路径配置
const projectRoot = path.resolve(__dirname, '../..'); // 项目根目录
const srcPath = path.join(projectRoot, 'src'); // Python 源代码目录
const casesPath = path.join(srcPath, 'CASES'); // 视频输出目录

// 确保输出目录存在
if (!fs.existsSync(casesPath)) {
  fs.mkdirSync(casesPath, { recursive: true });
}

// 提供静态文件服务 - 用于访问生成的视频文件
app.use('/videos', express.static(casesPath));

// 辅助函数：根据操作系统获取 Python 命令
function getPythonCommand() {
  return process.platform === 'win32' ? 'python' : 'python3';
}

// ==================== API 路由 ====================

// 获取所有视频生成任务列表
app.get('/api/jobs', (req, res) => {
  // 将 Map 转换为数组，并只返回必要的字段
  const jobList = Array.from(jobs.values()).map(job => ({
    id: job.id,
    knowledgePoint: job.knowledgePoint,
    status: job.status, // 状态：queued(排队), running(运行中), completed(已完成), failed(失败)
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error,
    outputDir: job.outputDir
  }));
  res.json(jobList);
});

// 获取特定任务的详细信息（包括执行日志）
app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({
    id: job.id,
    knowledgePoint: job.knowledgePoint,
    status: job.status,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error,
    outputDir: job.outputDir,
    output: job.output // 包含 stdout 和 stderr 的日志数组
  });
});

// 创建新的视频生成任务
app.post('/api/generate', generateLimiter, (req, res) => {
  const { knowledgePoint, useFeedback, useAssets } = req.body;
  
  // 验证必填参数
  if (!knowledgePoint) {
    return res.status(400).json({ error: 'Knowledge point is required' });
  }

  // 创建新任务
  const jobId = uuidv4();
  const job = {
    id: jobId,
    knowledgePoint,
    status: 'queued', // 初始状态为排队
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    output: [], // 存储执行日志
    outputDir: null, // 视频输出目录
    process: null // 子进程引用
  };

  jobs.set(jobId, job);

  // 在后台启动视频生成（延迟100ms以确保响应先返回）
  setTimeout(() => {
    generateVideo(jobId, knowledgePoint, useFeedback, useAssets);
  }, 100);

  res.json({ jobId, status: 'queued' });
});

// 删除任务
app.delete('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // 如果任务正在运行，终止其进程
  if (job.process && job.status === 'running') {
    try {
      job.process.kill();
    } catch (err) {
      console.error('Error killing process:', err);
    }
  }

  jobs.delete(req.params.id);
  res.json({ message: 'Job deleted successfully' });
});

// 获取已生成的视频列表
app.get('/api/videos', (req, res) => {
  try {
    if (!fs.existsSync(casesPath)) {
      return res.json([]);
    }

    const videos = [];
    const folders = fs.readdirSync(casesPath);

    // 遍历所有文件夹查找 .mp4 视频文件
    folders.forEach(folder => {
      const folderPath = path.join(casesPath, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
          if (file.endsWith('.mp4')) {
            videos.push({
              name: file,
              folder: folder,
              path: `/videos/${folder}/${file}`, // 用于浏览器访问的路径
              fullPath: path.join(folderPath, file), // 服务器上的完整路径
              createdAt: fs.statSync(path.join(folderPath, file)).mtime // 文件创建时间
            });
          }
        });
      }
    });

    // 按创建时间降序排序（最新的在前）
    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(videos);
  } catch (err) {
    console.error('Error listing videos:', err);
    res.status(500).json({ error: 'Failed to list videos' });
  }
});

// ==================== 视频生成函数 ====================

/**
 * 生成视频的核心函数
 * @param {string} jobId - 任务ID
 * @param {string} knowledgePoint - 知识点描述
 * @param {boolean} useFeedback - 是否使用视觉反馈优化
 * @param {boolean} useAssets - 是否使用外部素材（图标等）
 */
function generateVideo(jobId, knowledgePoint, useFeedback = true, useAssets = true) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'running'; // 更新状态为运行中
  job.output = [];

  const pythonCmd = getPythonCommand();
  // 构建 Python 脚本的命令行参数
  const args = [
    path.join(srcPath, 'agent.py'),
    '--knowledge_point', knowledgePoint,
    '--idx', '0',
    '--folder', 'CASES',
    '--api', 'gpt-4',
    '--use_feedback', useFeedback ? 'True' : 'False',
    '--use_assets', useAssets ? 'True' : 'False'
  ];

  console.log(`Starting video generation: ${pythonCmd} ${args.join(' ')}`);

  // 使用 spawn 启动 Python 子进程
  const process = spawn(pythonCmd, args, {
    cwd: srcPath,
    env: { ...process.env }
  });

  job.process = process;

  // 监听标准输出 - 捕获正常输出信息
  process.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[${jobId}] stdout:`, output);
    job.output.push({ type: 'stdout', text: output, timestamp: new Date().toISOString() });
    
    // 尝试从输出中提取视频输出目录
    const dirMatch = output.match(/Output directory: (.+)/);
    if (dirMatch) {
      job.outputDir = dirMatch[1];
    }
  });

  // 监听标准错误 - 捕获错误信息
  process.stderr.on('data', (data) => {
    const output = data.toString();
    console.error(`[${jobId}] stderr:`, output);
    job.output.push({ type: 'stderr', text: output, timestamp: new Date().toISOString() });
  });

  // 监听进程结束事件
  process.on('close', (code) => {
    console.log(`[${jobId}] Process exited with code ${code}`);
    
    // 根据退出代码更新任务状态
    if (code === 0) {
      job.status = 'completed'; // 成功完成
    } else {
      job.status = 'failed'; // 执行失败
      job.error = `Process exited with code ${code}`;
    }
    
    job.completedAt = new Date().toISOString();
    job.process = null;
  });

  // 监听进程错误事件
  process.on('error', (err) => {
    console.error(`[${jobId}] Process error:`, err);
    job.status = 'failed';
    job.error = err.message;
    job.completedAt = new Date().toISOString();
    job.process = null;
  });
}

// ==================== 其他路由 ====================

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 生产环境：提供前端静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  // 所有其他路由返回 index.html（支持前端路由）
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`Code2Video Web Interface server running on http://localhost:${PORT}`);
  console.log(`Project root: ${projectRoot}`);
  console.log(`Source path: ${srcPath}`);
  console.log(`Cases path: ${casesPath}`);
});
