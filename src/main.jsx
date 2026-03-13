import React from 'react';
import ReactDOM from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';

const shell = window.fallbackDesktop;
const config = shell.config();

const css = `
:root {
  color-scheme: dark;
  --bg: #07111f;
  --panel: rgba(10, 21, 38, 0.86);
  --panel-strong: rgba(12, 25, 46, 0.96);
  --line: rgba(123, 155, 198, 0.22);
  --ink: #edf5ff;
  --muted: #8fa4bf;
  --good: #31d0a0;
  --warn: #f5b14c;
  --bad: #f26f63;
  --accent: #63a8ff;
  --accent-2: #89f0d2;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(89, 130, 255, 0.28), transparent 28%),
    radial-gradient(circle at 80% 10%, rgba(20, 171, 135, 0.18), transparent 24%),
    linear-gradient(180deg, #09111f 0%, #07101d 100%);
}
button, input { font: inherit; }
.app { padding: 28px; display: grid; gap: 20px; }
.hero {
  display: grid; gap: 10px; padding: 24px 26px;
  background: linear-gradient(135deg, rgba(16, 30, 55, 0.96), rgba(8, 18, 32, 0.94));
  border: 1px solid var(--line); border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.28);
}
.eyebrow { color: var(--accent-2); font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; }
.title { font-size: 34px; font-weight: 800; letter-spacing: -0.04em; }
.subtitle { color: var(--muted); max-width: 900px; line-height: 1.5; }
.grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; }
.panel {
  background: var(--panel); border: 1px solid var(--line); border-radius: 22px; padding: 18px 18px 16px;
  backdrop-filter: blur(14px);
}
.panel h2 { margin: 0 0 14px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--muted); }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.metric { background: rgba(9, 17, 31, 0.72); border: 1px solid var(--line); border-radius: 18px; padding: 16px; }
.metric label { display:block; font-size: 12px; color: var(--muted); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.12em; }
.metric strong { font-size: 24px; }
.good { color: var(--good); }
.warn { color: var(--warn); }
.bad { color: var(--bad); }
.row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.input { background: rgba(5, 11, 21, 0.8); color: var(--ink); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; min-width: 280px; }
.btn { background: linear-gradient(135deg, #3f7cff, #2bc7a2); color: white; border: 0; border-radius: 14px; padding: 12px 16px; font-weight: 700; cursor: pointer; }
.btn.secondary { background: linear-gradient(135deg, #172946, #0f1930); border: 1px solid var(--line); }
.kv { display:grid; grid-template-columns: 160px 1fr; gap: 10px 14px; font-size: 14px; }
.kv div:nth-child(odd) { color: var(--muted); }
pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.45; background: rgba(5, 11, 21, 0.8); border: 1px solid var(--line); border-radius: 18px; padding: 14px; max-height: 260px; overflow: auto; }
.cols { display:grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.badge { display:inline-flex; align-items:center; gap:8px; border-radius:999px; padding:6px 12px; background: rgba(9,17,31,0.72); border:1px solid var(--line); }
.dot { width:10px; height:10px; border-radius:50%; }
@media (max-width: 1100px) { .grid, .cols { grid-template-columns: 1fr; } .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;

function StatusBadge({ status, busy }) {
  const tone = status !== 'ok' ? 'bad' : busy ? 'warn' : 'good';
  const color = tone === 'good' ? '#31d0a0' : tone === 'warn' ? '#f5b14c' : '#f26f63';
  return <span className="badge"><span className="dot" style={{ background: color }} />{busy ? 'Busy' : 'Idle'}</span>;
}

function App() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState({ runner: '', reverse: '', state: '' });
  const [deployRef, setDeployRef] = useState('main');
  const [manualMessage, setManualMessage] = useState('');

  async function refresh() {
    const statusRes = await shell.fetchStatus();
    setStatus(statusRes);
    setLogs(shell.logs());
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, []);

  const metrics = useMemo(() => ({
    status: status?.status || 'unknown',
    busy: Boolean(status?.busy),
    lastError: status?.lastError || 'none',
    lastSha: status?.lastResult?.sha || 'none'
  }), [status]);

  async function triggerDeploy() {
    setManualMessage('Triggering deploy...');
    const result = await shell.triggerDeploy(deployRef);
    setManualMessage(result.ok ? `Accepted manual deploy for ${deployRef}` : `Failed with ${result.status}: ${result.body}`);
    setTimeout(refresh, 800);
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <section className="hero">
          <div className="eyebrow">Fallback Runner Desktop</div>
          <div className="title">Contabo CI/CD Control Surface</div>
          <div className="subtitle">Local desktop monitor for the WSL fallback runner. It polls the live runner API, surfaces active jobs and errors, and keeps the tmux-backed runner and reverse tunnel observable without opening a terminal.</div>
        </section>
        <section className="panel">
          <h2>Runner State</h2>
          <div className="metrics">
            <div className="metric"><label>Mode</label><strong className={metrics.status === 'ok' ? 'good' : 'bad'}>{metrics.status}</strong></div>
            <div className="metric"><label>Activity</label><strong className={metrics.busy ? 'warn' : 'good'}>{metrics.busy ? 'Busy' : 'Idle'}</strong></div>
            <div className="metric"><label>Last SHA</label><strong style={{ fontSize: '14px' }}>{metrics.lastSha}</strong></div>
            <div className="metric"><label>API</label><strong style={{ fontSize: '14px' }}>{config.apiBaseUrl}</strong></div>
          </div>
        </section>
        <div className="grid">
          <section className="panel">
            <h2>Deploy Control</h2>
            <div className="row" style={{ marginBottom: 16 }}>
              <StatusBadge status={status?.status} busy={status?.busy} />
              <span className={status?.lastError ? 'bad' : 'good'}>{status?.lastError ? `Last error: ${status.lastError}` : 'No active error'}</span>
            </div>
            <div className="row" style={{ marginBottom: 16 }}>
              <input className="input" value={deployRef} onChange={(e) => setDeployRef(e.target.value)} placeholder="main or svc/erp-fe/main" />
              <button className="btn" onClick={triggerDeploy}>Trigger Deploy</button>
              <button className="btn secondary" onClick={refresh}>Refresh</button>
            </div>
            {manualMessage ? <div style={{ marginBottom: 16, color: '#89f0d2' }}>{manualMessage}</div> : null}
            <div className="kv">
              <div>Active Job</div><div>{status?.activeJob ? JSON.stringify(status.activeJob) : 'none'}</div>
              <div>Last Result</div><div>{status?.lastResult ? JSON.stringify(status.lastResult) : 'none'}</div>
              <div>Local State File</div><div>{config.stateFile}</div>
              <div>Manual Token</div><div>{config.manualTokenConfigured ? 'Configured' : 'Not configured'}</div>
            </div>
          </section>
          <section className="panel">
            <h2>Health Snapshot</h2>
            <div className="kv">
              <div>Runner Busy</div><div>{String(status?.busy ?? false)}</div>
              <div>Runner Error</div><div>{status?.lastError || 'none'}</div>
              <div>Reverse Tunnel</div><div>{logs.reverse ? 'Log present' : 'No log'}</div>
              <div>Runner Log</div><div>{logs.runner ? 'Log present' : 'No log'}</div>
              <div>Deploy State</div><div>{logs.state ? 'State loaded' : 'No state file'}</div>
            </div>
          </section>
        </div>
        <div className="cols">
          <section className="panel"><h2>Runner Log Tail</h2><pre>{logs.runner || 'No runner log yet.'}</pre></section>
          <section className="panel"><h2>Reverse Tunnel Log Tail</h2><pre>{logs.reverse || 'No reverse tunnel log yet.'}</pre></section>
        </div>
        <section className="panel"><h2>Deploy State File</h2><pre>{logs.state || 'No deploy state file yet.'}</pre></section>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
