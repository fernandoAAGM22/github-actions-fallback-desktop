const { contextBridge } = require('electron');
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

function loadConfig() {
  const env = parseEnvFile(envFile);
  return {
    apiBaseUrl: `http://${env.LISTEN_HOST || '127.0.0.1'}:${env.LISTEN_PORT || '8797'}`,
    manualToken: env.MANUAL_TRIGGER_TOKEN || '',
    manualTokenConfigured: Boolean(env.MANUAL_TRIGGER_TOKEN),
    stateFile,
    runnerLog,
    reverseLog
  };
}

function tailFile(filePath, lines = 80) {
  if (!fs.existsSync(filePath)) return '';
  const data = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  return data.slice(Math.max(0, data.length - lines)).join('\n');
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
    const response = await fetch(`${env.apiBaseUrl}/status`);
    return response.json();
  }
});
