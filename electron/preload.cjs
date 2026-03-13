const { contextBridge, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const baseDir = '/home/faagm24/projects/github-actions-fallback';
const envFile = path.join(baseDir, '.env');
const runnerLog = path.join(baseDir, 'runtime/logs/runner.log');
const reverseLog = path.join(baseDir, 'runtime/logs/reverse-tunnel.log');
const stateFile = path.join(baseDir, 'runtime/deploy-state.json');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return acc;
    acc[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    return acc;
  }, {});
}

function parseRepoSlug(remoteUrl) {
  if (!remoteUrl) return 'fernandoAAGM22/mun-sung-core';
  return remoteUrl.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
}

function loadConfig() {
  const env = parseEnvFile(envFile);
  const repoSlug = parseRepoSlug(env.GIT_REMOTE_URL);
  return {
    apiBaseUrl: `http://${env.LISTEN_HOST || '127.0.0.1'}:${env.LISTEN_PORT || '8797'}`,
    manualToken: env.MANUAL_TRIGGER_TOKEN || '',
    manualTokenConfigured: Boolean(env.MANUAL_TRIGGER_TOKEN),
    stateFile,
    runnerLog,
    reverseLog,
    repoSlug
  };
}

function tailFile(filePath, lines = 80) {
  if (!fs.existsSync(filePath)) return '';
  const data = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  return data.slice(Math.max(0, data.length - lines)).join('\n');
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text || response.statusText };
  }
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with ${response.status}`);
  }
  return payload;
}

contextBridge.exposeInMainWorld('fallbackDesktop', {
  config() {
    const { manualToken, ...rest } = loadConfig();
    return rest;
  },
  logs() {
    return {
      runner: tailFile(runnerLog, 100),
      reverse: tailFile(reverseLog, 100),
      state: fs.existsSync(stateFile) ? fs.readFileSync(stateFile, 'utf8') : ''
    };
  },
  async triggerDeploy(refName) {
    const env = loadConfig();
    const headers = { 'X-Deploy-Ref': refName || 'main' };
    if (env.manualToken) headers['X-Trigger-Token'] = env.manualToken;
    const response = await fetch(`${env.apiBaseUrl}/deploy`, { method: 'POST', headers });
    const text = await response.text();
    return { ok: response.ok, status: response.status, body: text };
  },
  async fetchStatus() {
    const env = loadConfig();
    return fetchJson(`${env.apiBaseUrl}/status`);
  },
  async fetchSourceStatus() {
    const env = loadConfig();
    return fetchJson(`${env.apiBaseUrl}/source/status`);
  },
  async syncSourceMirror(refName) {
    const env = loadConfig();
    const headers = {};
    if (env.manualToken) headers['X-Trigger-Token'] = env.manualToken;
    const qp = refName ? `?ref=${encodeURIComponent(refName)}` : '';
    return fetchJson(`${env.apiBaseUrl}/source/sync${qp}`, { method: 'POST', headers });
  },
  async fetchSourceDiff(refName) {
    const env = loadConfig();
    const qp = refName ? `?ref=${encodeURIComponent(refName)}` : '';
    return fetchJson(`${env.apiBaseUrl}/source/diff${qp}`);
  },
  async fetchActionsWorkflows() {
    const env = loadConfig();
    return fetchJson(`${env.apiBaseUrl}/actions/workflows`);
  },
  async fetchActionsRuns(workflowId) {
    const env = loadConfig();
    const qp = workflowId ? `?workflowId=${encodeURIComponent(workflowId)}` : '';
    return fetchJson(`${env.apiBaseUrl}/actions/runs${qp}`);
  },
  async fetchActionsRunDetail(runId) {
    const env = loadConfig();
    return fetchJson(`${env.apiBaseUrl}/actions/runs/${encodeURIComponent(runId)}`);
  },
  async openExternal(url) {
    if (!url) return false;
    await shell.openExternal(url);
    return true;
  }
});
