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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 video generation requests per hour
  message: 'Too many video generation requests, please try again later.',
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/', limiter); // Apply rate limiting to all API routes

// Store for generation jobs
const jobs = new Map();

// Paths
const projectRoot = path.resolve(__dirname, '../..');
const srcPath = path.join(projectRoot, 'src');
const casesPath = path.join(srcPath, 'CASES');

// Ensure CASES directory exists
if (!fs.existsSync(casesPath)) {
  fs.mkdirSync(casesPath, { recursive: true });
}

// Serve static files from CASES directory
app.use('/videos', express.static(casesPath));

// Helper function to get Python path
function getPythonCommand() {
  return process.platform === 'win32' ? 'python' : 'python3';
}

// API Routes

// Get all generation jobs
app.get('/api/jobs', (req, res) => {
  const jobList = Array.from(jobs.values()).map(job => ({
    id: job.id,
    knowledgePoint: job.knowledgePoint,
    status: job.status,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error,
    outputDir: job.outputDir
  }));
  res.json(jobList);
});

// Get specific job status
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
    output: job.output
  });
});

// Create new video generation job
app.post('/api/generate', generateLimiter, (req, res) => {
  const { knowledgePoint, useFeedback, useAssets } = req.body;
  
  if (!knowledgePoint) {
    return res.status(400).json({ error: 'Knowledge point is required' });
  }

  const jobId = uuidv4();
  const job = {
    id: jobId,
    knowledgePoint,
    status: 'queued',
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    output: [],
    outputDir: null,
    process: null
  };

  jobs.set(jobId, job);

  // Start video generation in background
  setTimeout(() => {
    generateVideo(jobId, knowledgePoint, useFeedback, useAssets);
  }, 100);

  res.json({ jobId, status: 'queued' });
});

// Delete a job
app.delete('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Kill process if running
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

// Get list of generated videos
app.get('/api/videos', (req, res) => {
  try {
    if (!fs.existsSync(casesPath)) {
      return res.json([]);
    }

    const videos = [];
    const folders = fs.readdirSync(casesPath);

    folders.forEach(folder => {
      const folderPath = path.join(casesPath, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
          if (file.endsWith('.mp4')) {
            videos.push({
              name: file,
              folder: folder,
              path: `/videos/${folder}/${file}`,
              fullPath: path.join(folderPath, file),
              createdAt: fs.statSync(path.join(folderPath, file)).mtime
            });
          }
        });
      }
    });

    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(videos);
  } catch (err) {
    console.error('Error listing videos:', err);
    res.status(500).json({ error: 'Failed to list videos' });
  }
});

// Function to generate video
function generateVideo(jobId, knowledgePoint, useFeedback = true, useAssets = true) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'running';
  job.output = [];

  const pythonCmd = getPythonCommand();
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

  const process = spawn(pythonCmd, args, {
    cwd: srcPath,
    env: { ...process.env }
  });

  job.process = process;

  process.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[${jobId}] stdout:`, output);
    job.output.push({ type: 'stdout', text: output, timestamp: new Date().toISOString() });
    
    // Try to detect output directory
    const dirMatch = output.match(/Output directory: (.+)/);
    if (dirMatch) {
      job.outputDir = dirMatch[1];
    }
  });

  process.stderr.on('data', (data) => {
    const output = data.toString();
    console.error(`[${jobId}] stderr:`, output);
    job.output.push({ type: 'stderr', text: output, timestamp: new Date().toISOString() });
  });

  process.on('close', (code) => {
    console.log(`[${jobId}] Process exited with code ${code}`);
    
    if (code === 0) {
      job.status = 'completed';
    } else {
      job.status = 'failed';
      job.error = `Process exited with code ${code}`;
    }
    
    job.completedAt = new Date().toISOString();
    job.process = null;
  });

  process.on('error', (err) => {
    console.error(`[${jobId}] Process error:`, err);
    job.status = 'failed';
    job.error = err.message;
    job.completedAt = new Date().toISOString();
    job.process = null;
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Code2Video Web Interface server running on http://localhost:${PORT}`);
  console.log(`Project root: ${projectRoot}`);
  console.log(`Source path: ${srcPath}`);
  console.log(`Cases path: ${casesPath}`);
});
