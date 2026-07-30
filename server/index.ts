import express, { type Request, type Response } from 'express';
import cors from 'cors';


const app = express();
app.use(cors());
app.use(express.json());

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
  { id: '1', name: 'Lint & Static Analysis', status: 'passed', duration: 4, logs: ['[INFO] Running oxlint...', '[SUCCESS] No lint issues found.'] },
  { id: '2', name: 'Unit & Integration Tests', status: 'passed', duration: 12, logs: ['[INFO] Running Vitest suite...', '[SUCCESS] 14 tests passed (100%).'] },
  { id: '3', name: 'Docker Image Build', status: 'passed', duration: 28, logs: ['[INFO] Building multi-stage Dockerfile...', '[SUCCESS] Image cicd-web-app:v1.2.0 compiled (64MB).'] },
  { id: '4', name: 'Security Vulnerability Scan', status: 'passed', duration: 8, logs: ['[INFO] Scanning container with Trivy...', '[SUCCESS] 0 Critical, 0 High vulnerabilities.'] },
  { id: '5', name: 'Container Deployment', status: 'passed', duration: 6, logs: ['[INFO] Deploying container web-app-prod...', '[SUCCESS] Container active on port 8080.'] },
];

let environment: DeploymentEnvironment = {
  name: 'Production (Docker)',
  url: 'http://localhost:8080',
  containerId: 'cnt-8f92a1b4',
  status: 'running',
  uptime: '99.98%',
  version: 'v1.2.0',
};

// Blueprint Root API Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'Success', message: 'CI/CD Pipeline is Live!' });
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
  
  // Reset stages to running state simulation
  stages = stages.map((stg) => ({
    ...stg,
    status: 'passed',
    logs: [...stg.logs, `[TRIGGER] Re-run requested: ${commitMsg} at ${new Date().toLocaleTimeString()}`],
  }));

  res.status(200).json({ message: 'Pipeline triggered successfully', stages, environment });
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
  });
}
