import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.ts';


describe('DevOps API Pipeline Endpoints', () => {
  it('GET / returns status Success and message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Success');
    expect(res.body.message).toBe('CI/CD Pipeline is Live!');
  });

  it('GET /api/health returns HTTP 200 with status ok', async () => {

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('devops-pipeline-api');
  });

  it('GET /api/pipeline returns stage configurations and docker env', async () => {
    const res = await request(app).get('/api/pipeline');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.stages)).toBe(true);
    expect(res.body.stages.length).toBe(5);
    expect(res.body.environment.status).toBe('running');
  });

  it('POST /api/pipeline/trigger simulates pipeline execution', async () => {
    const res = await request(app)
      .post('/api/pipeline/trigger')
      .send({ commitMsg: 'feat: add automated docker container deployment' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Pipeline triggered successfully');
  });
});
