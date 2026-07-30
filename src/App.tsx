import { useState, useEffect } from 'react';

import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Terminal, 
  Server, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  Cpu,
  Activity,
  GitBranch,
  Box
} from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  duration: number;
  logs: string[];
}

interface DockerEnv {
  name: string;
  url: string;
  containerId: string;
  status: 'running' | 'stopped' | 'deploying';
  uptime: string;
  version: string;
}

export default function App() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [environment, setEnvironment] = useState<DockerEnv | null>(null);
  const [activeStageId, setActiveStageId] = useState<string>('1');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  const fetchPipelineData = async () => {
    try {
      const res = await fetch('/api/pipeline');
      if (res.ok) {
        const data = await res.json();
        setStages(data.stages);
        setEnvironment(data.environment);
        setBackendConnected(true);
      }
    } catch {
      setBackendConnected(false);
    }
  };


  useEffect(() => {
    fetchPipelineData();
    
    // Connect to WebSocket Server for Real-Time Streaming Updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setBackendConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PIPELINE_UPDATE') {
          setStages(data.stages);
          setEnvironment(data.environment);
          setBackendConnected(true);
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onerror = () => {
      setBackendConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleTriggerPipeline = async () => {
    setIsTriggering(true);
    try {
      await fetch('/api/pipeline/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMsg: 'Live WebSocket trigger from UI dashboard' })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsTriggering(false), 800);
    }
  };


  const activeStage = stages.find((s) => s.id === activeStageId) || stages[0];

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Bar */}
      <header className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <Box size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DevOps CI/CD Automation Center
            </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <GitBranch size={14} color="var(--accent-cyan)" /> Branch: <code style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>main</code> 
                <span style={{ margin: '0 0.25rem' }}>•</span>
                <Activity size={14} color={backendConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'} /> 
                {backendConnected ? 'Live API Telemetry Connected' : 'Reconnecting to API...'}
              </p>
          </div>
        </div>

        <button 
          onClick={handleTriggerPipeline}
          disabled={isTriggering}
          style={{
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: isTriggering ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s ease',
            opacity: isTriggering ? 0.7 : 1
          }}
        >
          {isTriggering ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
          Trigger Pipeline Build
        </button>
      </header>

      {/* Top Telemetry Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '10px' }}>
            <CheckCircle2 size={24} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pipeline Status</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>100% Passing</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '10px' }}>
            <Server size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Docker Container</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{environment?.containerId || 'cnt-prod-01'}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.75rem', borderRadius: '10px' }}>
            <Cpu size={24} color="var(--accent-purple)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Container Uptime</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>{environment?.uptime || '99.99%'}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.75rem', borderRadius: '10px' }}>
            <ShieldCheck size={24} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vulnerability Scan</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>0 CVE Critical</div>
          </div>
        </div>
      </div>

      {/* Main CI/CD Workflow Pipeline Visualizer */}
      <section className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} color="var(--accent-cyan)" /> Automated CI/CD Pipeline Workflow
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', position: 'relative' }}>
          {stages.map((stage, idx) => {
            const isSelected = stage.id === activeStageId;
            return (
              <div 
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>STAGE 0{idx + 1}</span>
                  {stage.status === 'passed' && <CheckCircle2 size={18} color="var(--accent-emerald)" />}
                  {stage.status === 'running' && <Loader2 size={18} className="animate-spin" color="var(--accent-cyan)" />}
                  {stage.status === 'failed' && <AlertCircle size={18} color="var(--accent-rose)" />}
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                  {stage.name}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Duration: {stage.duration}s
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grid: Console Logs & Live Docker Deployment Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
        {/* Real-time Console Log Terminal */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <Terminal size={18} color="var(--accent-cyan)" /> Stage Execution Terminal ({activeStage?.name})
            </h3>
            <button 
              onClick={fetchPipelineData}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <RefreshCw size={14} /> Refresh Logs
            </button>
          </div>

          <div 
            ref={(el) => {
              if (el) el.scrollTop = el.scrollHeight;
            }}
            style={{ 
              background: '#070a12', 
              borderRadius: '10px', 
              padding: '1.25rem', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.85rem', 
              minHeight: '220px',
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {activeStage?.logs.map((line, index) => (
              <div 
                key={index} 
                style={{ 
                  marginBottom: '0.4rem', 
                  padding: line.includes('[EXEC]') || line.includes('[INIT]') ? '0.2rem 0.4rem' : '0',
                  borderRadius: '4px',
                  background: line.includes('[EXEC]') ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  color: line.includes('[SUCCESS]') ? 'var(--accent-emerald)' : line.includes('[EXEC]') ? 'var(--accent-cyan)' : line.includes('[INIT]') ? 'var(--accent-amber)' : '#d1d5db',
                  fontWeight: line.includes('[EXEC]') ? 600 : 400
                }}
              >
                {line}
              </div>
            ))}
          </div>

        </section>

        {/* Live Container Deployment Info */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <Server size={18} color="var(--accent-purple)" /> Deployed Docker Container
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Environment</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{environment?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
                  {environment?.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Container Endpoint</span>
                <a href={environment?.url || 'http://localhost:8080'} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {environment?.url} <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Docker Compose Verification Command:</div>
            <code style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', display: 'block', wordBreak: 'break-all' }}>
              docker compose up --build -d
            </code>
          </div>
        </section>
      </div>
    </div>
  );
}
