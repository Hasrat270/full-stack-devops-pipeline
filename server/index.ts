import express, { type Request, type Response } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

export interface PipelineStage {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  duration: number; // in seconds
  logs: string[];
}

export interface DeploymentEnvironment {
  name: string;
  url: string;
  containerId: string;
  status: 'running' | 'stopped' | 'deploying';
  uptime: string;
  version: string;
}

let stages: PipelineStage[] = [
  { id: '1', name: 'Lint & Static Analysis', status: 'passed', duration: 4, logs: ['[INFO] Running oxlint static checks...', '[SUCCESS] 0 syntax errors or lint warnings found.'] },
  { id: '2', name: 'Unit & Integration Tests', status: 'passed', duration: 12, logs: ['[INFO] Running Vitest suite...', '[SUCCESS] 4/4 backend tests passed (100%).'] },
  { id: '3', name: 'Docker Image Build', status: 'passed', duration: 28, logs: ['[INFO] Compiling multi-stage Docker images...', '[SUCCESS] Built ghcr.io/hasrat270/devops-web (64MB).'] },
  { id: '4', name: 'Security Vulnerability Scan', status: 'passed', duration: 8, logs: ['[INFO] Scanning container with Trivy...', '[SUCCESS] 0 Critical vulnerabilities detected.'] },
  { id: '5', name: 'AWS EC2 Container Deployment', status: 'passed', duration: 6, logs: ['[INFO] Executing zero-downtime SSH rollout...', '[SUCCESS] Containers running healthy on port 80.'] },
];

let environment: DeploymentEnvironment = {
  name: 'AWS EC2 Production (Docker)',
  url: 'http://16.171.13.107',
  containerId: 'cnt-ec2-7fa826e',
  status: 'running',
  uptime: '99.99%',
  version: 'v1.4.0',
};

// Broadcast data to all connected WebSocket clients
const broadcastState = () => {
  const payload = JSON.stringify({ type: 'PIPELINE_UPDATE', stages, environment });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'PIPELINE_UPDATE', stages, environment }));
});

// Function to simulate real-time live execution over WebSocket
const runLivePipeline = async (commitMsg: string) => {
  // Step 1: Set all stages to idle
  stages = stages.map(s => ({ ...s, status: 'idle', logs: [`[INIT] Queued pipeline for commit: "${commitMsg}"`] }));
  environment.status = 'deploying';
  broadcastState();

  for (let i = 0; i < stages.length; i++) {
    // Stage starts running
    stages[i].status = 'running';
    stages[i].logs.push(`[EXEC] Starting ${stages[i].name}...`);
    broadcastState();
    await new Promise((r) => setTimeout(r, 1500));

    // Stage progress update
    stages[i].logs.push(`[PROGRESS] Verifying step criteria...`);
    broadcastState();
    await new Promise((r) => setTimeout(r, 1500));

    // Stage completes
    stages[i].status = 'passed';
    stages[i].logs.push(`[SUCCESS] ${stages[i].name} completed in ${stages[i].duration}s.`);
    broadcastState();
  }

  environment.status = 'running';
  environment.containerId = `cnt-ec2-${Math.random().toString(16).substring(2, 9)}`;
  broadcastState();
};

// Blueprint Root API Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'Success', message: 'CI/CD Pipeline is Live with WebSockets!' });
});

// Health Check API
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), service: 'devops-pipeline-api' });
});

// Pipeline Status API
app.get('/api/pipeline', (_req: Request, res: Response) => {
  res.status(200).json({ stages, environment });
});

// Trigger Pipeline Simulation API
app.post('/api/pipeline/trigger', (req: Request, res: Response) => {
  const { commitMsg } = req.body || { commitMsg: 'Manual trigger' };
  runLivePipeline(commitMsg || 'Manual build request');
  res.status(200).json({ message: 'Live WebSocket pipeline execution started', stages, environment });
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Backend server with WebSockets listening on port ${PORT}`);
  });
}

