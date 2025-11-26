# Code2Video Web Interface

[中文](#中文说明) | [English](#english)

---

## 中文说明

### 简介

Code2Video Web界面是基于Node.js、Vue 3和Ant Design开发的Web应用，为Code2Video教学视频生成工具提供了友好的用户界面。

### 功能特性

- 🎬 **可视化视频生成**: 通过Web表单轻松提交视频生成任务
- 📊 **任务管理**: 实时查看任务状态和进度
- 📹 **视频库**: 浏览和播放已生成的视频
- 🎨 **现代化UI**: 基于Ant Design Vue的美观界面
- 🔄 **实时更新**: 自动刷新任务状态

### 技术栈

- **后端**: Node.js + Express
- **前端**: Vue 3 + Vite
- **UI组件**: Ant Design Vue
- **HTTP客户端**: Axios

### 快速开始

#### 前提条件

1. 已安装Node.js (推荐v16+)
2. 已安装Python环境和Code2Video依赖
3. 已配置好`src/api_config.json`中的API密钥

#### 安装

```bash
# 进入web-interface目录
cd web-interface

# 安装根目录依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

或使用一键安装脚本:

```bash
cd web-interface
npm run install-all
```

#### 开发模式

同时启动后端服务器和前端开发服务器:

```bash
npm run dev
```

- 后端服务器: http://localhost:3000
- 前端开发服务器: http://localhost:5173

#### 生产模式

```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

访问: http://localhost:3000

### 使用说明

#### 1. 生成视频

1. 在"生成视频"标签页中输入知识点
2. 选择是否启用反馈和素材选项
3. 点击"开始生成"按钮
4. 任务将被创建并自动跳转到任务列表

#### 2. 查看任务

1. 在"任务列表"标签页查看所有任务
2. 任务状态包括: 排队中、运行中、已完成、失败
3. 点击"详情"按钮查看任务执行日志
4. 可以删除不需要的任务

#### 3. 浏览视频

1. 在"视频库"标签页浏览所有已生成的视频
2. 点击视频卡片查看和播放视频
3. 可以下载视频到本地

### 项目结构

```
web-interface/
├── server/              # 后端代码
│   └── index.js        # Express服务器
├── client/             # 前端代码
│   ├── src/
│   │   ├── components/ # Vue组件
│   │   │   ├── GenerateForm.vue   # 视频生成表单
│   │   │   ├── JobsList.vue       # 任务列表
│   │   │   └── VideosList.vue     # 视频库
│   │   ├── api/        # API调用
│   │   ├── App.vue     # 主应用组件
│   │   └── main.js     # 应用入口
│   └── package.json
├── package.json
└── README.md
```

### API接口

#### 生成视频
```
POST /api/generate
{
  "knowledgePoint": "知识点",
  "useFeedback": true,
  "useAssets": true
}
```

#### 获取任务列表
```
GET /api/jobs
```

#### 获取任务详情
```
GET /api/jobs/:id
```

#### 删除任务
```
DELETE /api/jobs/:id
```

#### 获取视频列表
```
GET /api/videos
```

### 配置

创建`.env`文件配置服务器端口:

```bash
PORT=3000
```

前端API地址配置在`client/.env`:

```bash
VITE_API_URL=http://localhost:3000/api
```

### 故障排除

**问题: 无法启动服务器**
- 检查端口3000是否被占用
- 确保Python环境配置正确

**问题: 视频生成失败**
- 检查`src/api_config.json`中的API密钥配置
- 查看任务详情中的错误日志

**问题: 无法加载视频**
- 确保视频文件在`src/CASES`目录中
- 检查视频文件权限

---

## English

### Introduction

Code2Video Web Interface is a web application built with Node.js, Vue 3, and Ant Design, providing a user-friendly interface for the Code2Video educational video generation tool.

### Features

- 🎬 **Visual Video Generation**: Submit video generation tasks through web forms
- 📊 **Task Management**: View task status and progress in real-time
- 📹 **Video Library**: Browse and play generated videos
- 🎨 **Modern UI**: Beautiful interface based on Ant Design Vue
- 🔄 **Real-time Updates**: Auto-refresh task status

### Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vue 3 + Vite
- **UI Components**: Ant Design Vue
- **HTTP Client**: Axios

### Quick Start

#### Prerequisites

1. Node.js installed (v16+ recommended)
2. Python environment and Code2Video dependencies installed
3. API keys configured in `src/api_config.json`

#### Installation

```bash
# Navigate to web-interface directory
cd web-interface

# Install root dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

Or use the one-line installation:

```bash
cd web-interface
npm run install-all
```

#### Development Mode

Start both backend server and frontend dev server:

```bash
npm run dev
```

- Backend server: http://localhost:3000
- Frontend dev server: http://localhost:5173

#### Production Mode

```bash
# Build frontend
npm run build

# Start production server
npm start
```

Access: http://localhost:3000

### Usage

#### 1. Generate Video

1. Enter a knowledge point in the "Generate Video" tab
2. Choose whether to enable feedback and assets options
3. Click "Start Generation" button
4. Task will be created and automatically switch to task list

#### 2. View Tasks

1. View all tasks in the "Task List" tab
2. Task statuses include: Queued, Running, Completed, Failed
3. Click "Details" button to view task execution logs
4. Delete unwanted tasks

#### 3. Browse Videos

1. Browse all generated videos in "Video Library" tab
2. Click video card to view and play video
3. Download videos to local storage

### Project Structure

```
web-interface/
├── server/              # Backend code
│   └── index.js        # Express server
├── client/             # Frontend code
│   ├── src/
│   │   ├── components/ # Vue components
│   │   │   ├── GenerateForm.vue   # Video generation form
│   │   │   ├── JobsList.vue       # Task list
│   │   │   └── VideosList.vue     # Video library
│   │   ├── api/        # API calls
│   │   ├── App.vue     # Main app component
│   │   └── main.js     # App entry
│   └── package.json
├── package.json
└── README.md
```

### API Endpoints

#### Generate Video
```
POST /api/generate
{
  "knowledgePoint": "Knowledge point",
  "useFeedback": true,
  "useAssets": true
}
```

#### Get Jobs List
```
GET /api/jobs
```

#### Get Job Details
```
GET /api/jobs/:id
```

#### Delete Job
```
DELETE /api/jobs/:id
```

#### Get Videos List
```
GET /api/videos
```

### Configuration

Create `.env` file to configure server port:

```bash
PORT=3000
```

Frontend API URL configuration in `client/.env`:

```bash
VITE_API_URL=http://localhost:3000/api
```

### Troubleshooting

**Issue: Cannot start server**
- Check if port 3000 is already in use
- Ensure Python environment is configured correctly

**Issue: Video generation fails**
- Check API key configuration in `src/api_config.json`
- View error logs in task details

**Issue: Cannot load videos**
- Ensure video files are in `src/CASES` directory
- Check video file permissions

---

## License

Same as Code2Video project
