import React from 'react';
import ReactDOM from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';

const shell = window.fallbackDesktop ?? null;

function safeConfig() {
  if (!shell || typeof shell.config !== 'function') {
    return {
      apiBaseUrl: 'unavailable',
      manualTokenConfigured: false,
      stateFile: 'unavailable',
      preloadAvailable: false,
      repoSlug: 'fernandoAAGM22/mun-sung-core'
    };
  }

  try {
    return {
      ...shell.config(),
      preloadAvailable: true
    };
  } catch (error) {
    return {
      apiBaseUrl: 'unavailable',
      manualTokenConfigured: false,
      stateFile: 'unavailable',
      preloadAvailable: false,
      preloadError: error instanceof Error ? error.message : String(error),
      repoSlug: 'fernandoAAGM22/mun-sung-core'
    };
  }
}

const config = safeConfig();

const css = `
:root {
  color-scheme: dark;
  --bg: #050b14;
  --panel: #0b1220;
  --panel-2: #0e1729;
  --panel-3: #111c31;
  --line: rgba(138, 156, 189, 0.18);
  --line-strong: rgba(138, 156, 189, 0.32);
  --ink: #eef4ff;
  --muted: #93a4c2;
  --accent: #2f81f7;
  --accent-soft: rgba(47, 129, 247, 0.18);
  --good: #2ea043;
  --warn: #d29922;
  --bad: #f85149;
  --shadow: 0 20px 70px rgba(0, 0, 0, 0.32);
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(47, 129, 247, 0.12), transparent 25%),
    linear-gradient(180deg, #040912 0%, #050b14 100%);
}
button, input, select { font: inherit; }
a { color: inherit; text-decoration: none; }
.app {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--line);
  background: rgba(5, 11, 20, 0.94);
}
.brand { display: grid; gap: 4px; }
.brand-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
.brand-subtitle { color: var(--muted); font-size: 13px; }
.topbar-controls { display: flex; gap: 12px; align-items: center; }
.search {
  min-width: 320px;
  background: #07101d;
  border: 1px solid var(--line);
  color: var(--ink);
  border-radius: 10px;
  padding: 10px 12px;
}
.btn {
  background: var(--panel-3);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
}
.btn.primary { background: linear-gradient(135deg, #238636, #2f81f7); border-color: transparent; }
.btn.ghost { background: transparent; }
.layout {
  min-height: 0;
  display: grid;
  grid-template-columns: 330px 1.05fr 1.15fr;
}
.sidebar, .runsPane, .detailPane {
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--line);
}
.detailPane { border-right: 0; }
.section { padding: 18px; }
.section-title { font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 14px; }
.workflowList, .runList, .jobList, .annotationList, .logFileList {
  display: grid;
  gap: 8px;
}
.workflowItem, .runItem, .jobItem, .annotationItem, .logFileItem {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
}
.workflowItem:hover, .runItem:hover, .jobItem:hover, .annotationItem:hover, .logFileItem:hover {
  background: rgba(255,255,255,0.02);
  border-color: var(--line);
}
.workflowItem.active, .runItem.active, .jobItem.active, .logFileItem.active {
  background: rgba(255,255,255,0.04);
  border-color: var(--line-strong);
  box-shadow: inset 3px 0 0 var(--accent);
}
.workflowName, .runTitle, .jobTitle { font-weight: 700; }
.workflowMeta, .runMeta, .jobMeta, .muted { color: var(--muted); font-size: 12px; }
.sidebarFooter {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  display: grid;
  gap: 10px;
}
.linkButton {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--ink);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}
.runnerCard {
  margin-top: 18px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  box-shadow: var(--shadow);
}
.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.metric {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
}
.metric label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
  text-transform: uppercase;
}
.metric strong { font-size: 22px; }
.scroll {
  overflow: auto;
  min-height: 0;
}
.runsHeader, .detailHeader {
  padding: 22px 22px 10px;
  border-bottom: 1px solid var(--line);
}
.runsHeader h2, .detailHeader h2 { margin: 0; font-size: 16px; }
.runsHeader p, .detailHeader p { margin: 6px 0 0; color: var(--muted); }
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--line);
  font-size: 12px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.summaryGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.summaryCard {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
}
.summaryCard label {
  display: block;
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}
.summaryCard strong { font-size: 14px; }
.contentSection {
  padding: 18px 22px;
  border-bottom: 1px solid var(--line);
}
.contentSection h3 {
  margin: 0 0 14px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}
.kv {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 10px 14px;
}
.kv div:nth-child(odd) { color: var(--muted); }
.annotationBody { display: grid; gap: 4px; }
.annotationPath { color: var(--muted); font-size: 12px; }
.logLayout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 14px;
}
.logFileList {
  max-height: 360px;
  overflow: auto;
}
pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.45;
  background: #07101d;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  max-height: 520px;
  overflow: auto;
}
.empty {
  color: var(--muted);
  padding: 18px;
  border: 1px dashed var(--line);
  border-radius: 14px;
}
.good { color: var(--good); }
.warn { color: var(--warn); }
.bad { color: var(--bad); }
.inlineRow { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.smallInput {
  min-width: 220px;
  background: #07101d;
  border: 1px solid var(--line);
  color: var(--ink);
  border-radius: 10px;
  padding: 10px 12px;
}
@media (max-width: 1500px) {
  .layout { grid-template-columns: 300px 1fr 1fr; }
}
@media (max-width: 1220px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar, .runsPane { border-right: 0; border-bottom: 1px solid var(--line); }
  .summaryGrid, .metrics, .logLayout { grid-template-columns: 1fr; }
  .topbar { flex-direction: column; align-items: flex-start; }
  .topbar-controls { width: 100%; }
  .search { min-width: 0; width: 100%; }
}
`;

function statusTone(status, conclusion) {
  if (conclusion === 'success' || status === 'success') return 'good';
  if (conclusion === 'failure' || status === 'failure') return 'bad';
  if (conclusion === 'cancelled' || conclusion === 'timed_out') return 'warn';
  if (status === 'completed' && !conclusion) return 'warn';
  return status === 'in_progress' || status === 'queued' ? 'warn' : 'good';
}

function toneColor(tone) {
  return tone === 'good' ? '#2ea043' : tone === 'warn' ? '#d29922' : '#f85149';
}

function shortSha(sha) {
  return sha ? sha.slice(0, 7) : 'unknown';
}

function formatWhen(iso) {
  if (!iso) return 'unknown';
  const date = new Date(iso);
  return date.toLocaleString();
}

function formatAgo(iso) {
  if (!iso) return 'unknown';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function duration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return '—';
  const seconds = Math.max(0, Math.round((new Date(completedAt) - new Date(startedAt)) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem ? `${minutes}m ${rem}s` : `${minutes}m`;
}

function StatusBadge({ status, conclusion }) {
  const tone = statusTone(status, conclusion);
  return <span className="badge"><span className="dot" style={{ background: toneColor(tone) }} />{conclusion || status || 'unknown'}</span>;
}

function RunnerStatusCard({ status, logs }) {
  return (
    <div className="runnerCard">
      <div className="section-title">Fallback Runner</div>
      <div className="inlineRow" style={{ marginBottom: 12 }}>
        <StatusBadge status={status?.status} conclusion={status?.busy ? 'busy' : 'idle'} />
        <span className="muted">{status?.lastError ? `Last error: ${status.lastError}` : 'No active error'}</span>
      </div>
      <div className="kv" style={{ marginBottom: 12 }}>
        <div>Busy</div><div>{String(status?.busy ?? false)}</div>
        <div>Last SHA</div><div>{status?.lastResult?.sha || 'none'}</div>
        <div>Active Job</div><div>{status?.activeJob ? JSON.stringify(status.activeJob) : 'none'}</div>
        <div>Source Mode</div><div>{status?.sourceMode || 'unknown'}</div>
        <div>Source Repo</div><div>{status?.localSourceRepoDir || 'n/a'}</div>
        <div>Mirror Dir</div><div>{status?.mirrorDir || 'n/a'}</div>
        <div>Mirror SHA</div><div>{status?.sourceMeta?.sha || 'n/a'}</div>
      </div>
      <pre>{logs.runner || 'No runner log yet.'}</pre>
    </div>
  );
}

function App() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState({ runner: '', reverse: '', state: '' });
  const [uiError, setUiError] = useState(config.preloadError || '');
  const [workflowsPayload, setWorkflowsPayload] = useState({ workflows: [], links: {}, repoSlug: config.repoSlug });
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('all');
  const [runsPayload, setRunsPayload] = useState({ totalCount: 0, runs: [] });
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runDetail, setRunDetail] = useState(null);
  const [logFileName, setLogFileName] = useState('');
  const [search, setSearch] = useState('');
  const [deployRef, setDeployRef] = useState('main');
  const [manualMessage, setManualMessage] = useState('');
  const [sourceMessage, setSourceMessage] = useState('');
  const [sourceDiff, setSourceDiff] = useState(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function refreshRunner() {
    if (!shell) {
      setUiError('Electron preload bridge is not available.');
      return;
    }
    try {
      const statusRes = await shell.fetchStatus();
      setStatus(statusRes);
      setLogs(shell.logs());
    } catch (error) {
      setUiError(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshSourceDiff(refName = deployRef) {
    if (!shell) return;
    setLoadingSource(true);
    try {
      const payload = await shell.fetchSourceDiff(refName);
      setSourceDiff(payload);
      setUiError('');
    } catch (error) {
      setUiError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingSource(false);
    }
  }

  async function refreshWorkflows() {
    if (!shell) return;
    const payload = await shell.fetchActionsWorkflows();
    setWorkflowsPayload(payload);
  }

  async function refreshRuns(workflowId = selectedWorkflowId) {
    if (!shell) return;
    setLoadingRuns(true);
    try {
      const payload = await shell.fetchActionsRuns(workflowId);
      setRunsPayload(payload);
      if (!payload.runs.some((run) => run.id === selectedRunId)) {
        setSelectedRunId(payload.runs[0]?.id || null);
      }
    } finally {
      setLoadingRuns(false);
    }
  }

  async function refreshDetail(runId) {
    if (!shell || !runId) return;
    setLoadingDetail(true);
    try {
      const payload = await shell.fetchActionsRunDetail(runId);
      setRunDetail(payload);
      setLogFileName(payload.logs[0]?.name || '');
      setUiError('');
    } catch (error) {
      setUiError(error instanceof Error ? error.message : String(error));
      setRunDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    refreshRunner();
    refreshWorkflows().catch((error) => setUiError(error.message));
    const id = setInterval(refreshRunner, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    refreshRuns(selectedWorkflowId).catch((error) => setUiError(error.message));
  }, [selectedWorkflowId]);

  useEffect(() => {
    if (selectedRunId) {
      refreshDetail(selectedRunId).catch((error) => setUiError(error.message));
    }
  }, [selectedRunId]);

  const filteredRuns = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return runsPayload.runs;
    return runsPayload.runs.filter((run) => {
      return [
        run.displayTitle,
        run.name,
        run.branch,
        run.actor,
        run.event,
        shortSha(run.sha)
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [runsPayload, search]);

  const selectedWorkflow = workflowsPayload.workflows.find((workflow) => workflow.id === selectedWorkflowId) || workflowsPayload.workflows[0];
  const activeLog = runDetail?.logs?.find((item) => item.name === logFileName) || runDetail?.logs?.[0] || null;
  const managementLinks = workflowsPayload.links || {};

  async function openExternal(url) {
    if (!shell || !url) return;
    try {
      await shell.openExternal(url);
    } catch (error) {
      setUiError(error instanceof Error ? error.message : String(error));
    }
  }

  async function triggerDeploy() {
    if (!shell) return;
    setManualMessage(`Triggering mirror deploy for ${deployRef}...`);
    try {
      const result = await shell.triggerDeploy(deployRef);
      setManualMessage(result.ok ? `Accepted mirror deploy for ${deployRef}` : `Failed with ${result.status}: ${result.body}`);
      setTimeout(refreshRunner, 800);
    } catch (error) {
      setManualMessage(`Manual deploy failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function syncMirrorNow() {
    if (!shell) return;
    setSourceMessage(`Syncing mirror for ${deployRef}...`);
    setLoadingSource(true);
    try {
      const result = await shell.syncSourceMirror(deployRef);
      setSourceMessage(`Mirror synced to ${result.sha} (${result.updated ? 'updated' : 'already current'})`);
      await refreshRunner();
      await refreshSourceDiff(deployRef);
    } catch (error) {
      setSourceMessage(`Mirror sync failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingSource(false);
    }
  }

  const summaryRun = runDetail?.run;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="topbar">
          <div className="brand">
            <div className="brand-title">Actions Control Surface</div>
            <div className="brand-subtitle">Desktop view for the fallback runner and its local workflow history on {config.repoSlug}.</div>
          </div>
          <div className="topbar-controls">
            <input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter workflow runs" />
            <button className="btn" onClick={() => { refreshRunner(); refreshWorkflows(); refreshRuns(); if (selectedRunId) refreshDetail(selectedRunId); }}>Refresh</button>
            <button className="btn primary" onClick={() => openExternal(`${config.apiBaseUrl}/actions/workflows`)}>Open runner API</button>
          </div>
        </div>
        <div className="layout">
          <aside className="sidebar scroll">
            <div className="section">
              <div className="inlineRow" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Actions</div>
                <button className="btn primary" onClick={triggerDeploy}>Deploy from mirror</button>
              </div>
              <div className="workflowList">
                {workflowsPayload.workflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    className={`workflowItem ${selectedWorkflowId === workflow.id ? 'active' : ''}`}
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                  >
                    <div className="workflowName">{workflow.displayName}</div>
                    <div className="workflowMeta">{workflow.id === 'all' ? 'Showing runs from all workflows' : workflow.path}</div>
                  </button>
                ))}
              </div>
              <div className="sidebarFooter">
                <div className="section-title" style={{ marginBottom: 0 }}>Management</div>
                <button className="linkButton" onClick={() => openExternal(managementLinks.caches)}><span>Caches</span><span className="muted">{managementLinks.caches ? '↗' : 'local'}</span></button>
                <button className="linkButton" onClick={() => openExternal(managementLinks.attestations)}><span>Attestations</span><span className="muted">{managementLinks.attestations ? '↗' : 'local'}</span></button>
                <button className="linkButton" onClick={() => openExternal(managementLinks.runners)}><span>Runners</span><span className="muted">{managementLinks.runners ? '↗' : 'local'}</span></button>
                <button className="linkButton" onClick={() => openExternal(managementLinks.usage)}><span>Usage metrics</span><span className="muted">{managementLinks.usage ? '↗' : 'local'}</span></button>
                <button className="linkButton" onClick={() => openExternal(managementLinks.performance)}><span>Performance metrics</span><span className="muted">{managementLinks.performance ? '↗' : 'local'}</span></button>
              </div>
              <RunnerStatusCard status={status} logs={logs} />
            </div>
          </aside>

          <main className="runsPane">
            <div className="runsHeader">
              <h2>{selectedWorkflow?.displayName || 'All workflows'}</h2>
              <p>{selectedWorkflowId === 'all' ? `Showing runs from all workflows. ${runsPayload.totalCount} workflow runs.` : `Runs for ${selectedWorkflow?.name || 'selected workflow'}.`}</p>
              <div className="metrics" style={{ marginTop: 16, marginBottom: 0 }}>
                <div className="metric"><label>Runs</label><strong>{runsPayload.totalCount}</strong></div>
                <div className="metric"><label>Filtered</label><strong>{filteredRuns.length}</strong></div>
                <div className="metric"><label>Selected Branch</label><strong style={{ fontSize: 14 }}>{summaryRun?.branch || 'none'}</strong></div>
                <div className="metric"><label>Manual Deploy</label><strong style={{ fontSize: 14 }}>{config.manualTokenConfigured ? 'Ready' : 'Unavailable'}</strong></div>
              </div>
            </div>
            <div className="section scroll">
              {loadingRuns ? <div className="empty">Loading workflow runs…</div> : null}
              {!loadingRuns && filteredRuns.length === 0 ? <div className="empty">No workflow runs matched the current filter.</div> : null}
              <div className="runList">
                {filteredRuns.map((run) => (
                  <button key={run.id} className={`runItem ${selectedRunId === run.id ? 'active' : ''}`} onClick={() => setSelectedRunId(run.id)}>
                    <div className="inlineRow" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="runTitle">{run.displayTitle}</div>
                      <StatusBadge status={run.status} conclusion={run.conclusion} />
                    </div>
                    <div className="runMeta" style={{ marginBottom: 8 }}>{run.name} #{run.runNumber}: Commit {shortSha(run.sha)} pushed by {run.actor}</div>
                    <div className="inlineRow muted">
                      <span className="badge">{run.branch}</span>
                      <span>{run.event}</span>
                      <span>{formatAgo(run.createdAt)}</span>
                      <span>{duration(run.startedAt, run.updatedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>

          <section className="detailPane scroll">
            <div className="detailHeader">
              <h2>{summaryRun ? `${summaryRun.displayTitle} #${summaryRun.runNumber}` : 'Run detail'}</h2>
              <p>{summaryRun ? summaryRun.name : 'Select a workflow run to inspect summary, jobs, annotations, and logs.'}</p>
              {summaryRun ? (
                <div className="summaryGrid">
                  <div className="summaryCard"><label>Triggered via</label><strong>{summaryRun.event} {formatAgo(summaryRun.createdAt)}</strong></div>
                  <div className="summaryCard"><label>Status</label><strong className={statusTone(summaryRun.status, summaryRun.conclusion)}>{summaryRun.conclusion || summaryRun.status}</strong></div>
                  <div className="summaryCard"><label>Total duration</label><strong>{duration(summaryRun.startedAt, summaryRun.updatedAt)}</strong></div>
                  <div className="summaryCard"><label>Branch</label><strong>{summaryRun.branch}</strong></div>
                </div>
              ) : null}
            </div>

            <div className="contentSection">
              <h3>Mirror Control</h3>
              {!config.preloadAvailable ? <div className="empty">Preload bridge unavailable. The desktop app is in degraded mode.</div> : null}
              {uiError ? <div className="empty bad">{uiError}</div> : null}
              <div className="inlineRow" style={{ marginBottom: 12 }}>
                <input className="smallInput" value={deployRef} onChange={(event) => setDeployRef(event.target.value)} placeholder="main or svc/erp-fe/main" />
                <button className="btn" onClick={syncMirrorNow}>Sync mirror now</button>
                <button className="btn primary" onClick={triggerDeploy}>Deploy from mirror now</button>
                <button className="btn" onClick={() => refreshSourceDiff(deployRef)}>View mirror/source diff</button>
                {selectedRunId ? <button className="btn" onClick={() => refreshDetail(selectedRunId)}>Refresh run detail</button> : null}
              </div>
              {manualMessage ? <div className="muted">{manualMessage}</div> : null}
              {sourceMessage ? <div className="muted">{sourceMessage}</div> : null}
            </div>

            <div className="contentSection">
              <h3>Mirror Diff</h3>
              {loadingSource ? <div className="empty">Loading mirror state…</div> : null}
              {!loadingSource && !sourceDiff ? <div className="empty">No mirror/source diff loaded yet.</div> : null}
              {!loadingSource && sourceDiff ? (
                <>
                  <div className="kv" style={{ marginBottom: 14 }}>
                    <div>Mode</div><div>{sourceDiff.sourceMode}</div>
                    <div>Ref</div><div>{sourceDiff.ref}</div>
                    <div>Mirror SHA</div><div>{sourceDiff.mirrorSha || 'none'}</div>
                    <div>Source SHA</div><div>{sourceDiff.sourceSha || 'none'}</div>
                    <div>Changed</div><div>{String(sourceDiff.changed)}</div>
                  </div>
                  {!sourceDiff.files?.length ? <div className="empty">No file-level drift between mirror and source.</div> : (
                    <pre>{sourceDiff.files.map((entry) => `${entry.status} ${entry.path}`).join('\n')}</pre>
                  )}
                </>
              ) : null}
            </div>

            <div className="contentSection">
              <h3>Summary</h3>
              {!summaryRun ? <div className="empty">No workflow run selected.</div> : (
                <div className="kv">
                  <div>Commit</div><div>{shortSha(summaryRun.sha)} {summaryRun.headCommit ? `· ${summaryRun.headCommit.message}` : ''}</div>
                  <div>Actor</div><div>{summaryRun.actor}</div>
                  <div>Created</div><div>{formatWhen(summaryRun.createdAt)}</div>
                  <div>Started</div><div>{formatWhen(summaryRun.startedAt)}</div>
                  <div>Updated</div><div>{formatWhen(summaryRun.updatedAt)}</div>
                  <div>Workflow file</div><div>{summaryRun.workflowPath}</div>
                </div>
              )}
            </div>

            <div className="contentSection">
              <h3>Jobs</h3>
              {loadingDetail ? <div className="empty">Loading job detail…</div> : null}
              {!loadingDetail && !runDetail?.jobs?.length ? <div className="empty">No jobs returned for this run.</div> : null}
              <div className="jobList">
                {(runDetail?.jobs || []).map((job) => (
                  <div key={job.id} className="jobItem active" style={{ cursor: 'default' }}>
                    <div className="inlineRow" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="jobTitle">{job.name}</div>
                      <StatusBadge status={job.status} conclusion={job.conclusion} />
                    </div>
                    <div className="jobMeta">{duration(job.startedAt, job.completedAt)} · {job.labels.join(', ') || 'no runner labels'} · {job.runnerName || 'runner not assigned'}</div>
                    {job.steps?.length ? (
                      <div className="jobMeta" style={{ marginTop: 10 }}>
                        {job.steps.map((step) => `${step.number}. ${step.name} [${step.conclusion || step.status}]`).join(' · ')}
                      </div>
                    ) : (
                      <div className="jobMeta" style={{ marginTop: 10 }}>No individual steps were recorded for this job.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="contentSection">
              <h3>Annotations</h3>
              {!runDetail?.annotations?.length ? <div className="empty">No annotations returned for this run.</div> : (
                <div className="annotationList">
                  {runDetail.annotations.map((group) => (
                    <div key={group.jobId} className="annotationItem active" style={{ cursor: 'default' }}>
                      <div className="jobTitle" style={{ marginBottom: 10 }}>{group.jobName}</div>
                      {group.summary ? <div className="muted" style={{ marginBottom: 8 }}>{group.summary}</div> : null}
                      {group.text ? <div className="muted" style={{ marginBottom: 8 }}>{group.text}</div> : null}
                      {!group.items.length ? <div className="muted">No annotation items on this job.</div> : null}
                      {group.items.map((item, index) => (
                        <div key={`${group.jobId}-${index}`} className="annotationBody" style={{ marginBottom: 12 }}>
                          <div className={`jobTitle ${item.level === 'failure' ? 'bad' : item.level === 'warning' ? 'warn' : ''}`}>{item.message}</div>
                          <div className="annotationPath">{item.path}:{item.startLine}{item.endLine && item.endLine !== item.startLine ? `-${item.endLine}` : ''}</div>
                          {item.details ? <div className="muted">{item.details}</div> : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="contentSection">
              <h3>Logs</h3>
              {!runDetail?.logs?.length ? <div className="empty">No log archive was available for this run.</div> : (
                <div className="logLayout">
                  <div className="logFileList">
                    {runDetail.logs.map((item) => (
                      <button key={item.name} className={`logFileItem ${logFileName === item.name ? 'active' : ''}`} onClick={() => setLogFileName(item.name)}>
                        <div className="workflowName">{item.name}</div>
                        <div className="workflowMeta">{item.content.split(/\r?\n/).length} lines</div>
                      </button>
                    ))}
                  </div>
                  <pre>{activeLog?.content || 'Select a log file.'}</pre>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
