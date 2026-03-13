const { contextBridge, shell } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

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
    repoSlug,
    repoUrl: `https://github.com/${repoSlug}`,
    githubActionsUrl: `https://github.com/${repoSlug}/actions`
  };
}

function tailFile(filePath, lines = 80) {
  if (!fs.existsSync(filePath)) return '';
  const data = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  return data.slice(Math.max(0, data.length - lines)).join('\n');
}

function execJson(command, args) {
  const stdout = execFileSync(command, args, { encoding: 'utf8' });
  return JSON.parse(stdout);
}

function ghApiJson(apiPath, extraArgs = []) {
  return execJson('gh', ['api', apiPath, ...extraArgs]);
}

function workflowDisplayName(name) {
  return name === 'All workflows' ? name : name.replace(/^Deploy - /, '');
}

function ghLinks(repoSlug) {
  return {
    actions: `https://github.com/${repoSlug}/actions`,
    caches: `https://github.com/${repoSlug}/actions/caches`,
    attestations: `https://github.com/${repoSlug}/attestations`,
    runners: `https://github.com/${repoSlug}/settings/actions/runners`,
    usage: `https://github.com/${repoSlug}/settings/billing/actions`,
    performance: `https://github.com/${repoSlug}/actions`
  };
}

function fetchWorkflows() {
  const env = loadConfig();
  const payload = ghApiJson(`repos/${env.repoSlug}/actions/workflows?per_page=100`);
  const workflows = (payload.workflows || []).map((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    displayName: workflowDisplayName(workflow.name),
    path: workflow.path,
    state: workflow.state,
    url: workflow.html_url
  })).sort((a, b) => a.name.localeCompare(b.name));
  return {
    repoSlug: env.repoSlug,
    workflows: [{ id: 'all', name: 'All workflows', displayName: 'All workflows', path: '', state: 'active', url: env.githubActionsUrl }, ...workflows],
    links: ghLinks(env.repoSlug)
  };
}

function fetchWorkflowRuns(workflowId = 'all') {
  const env = loadConfig();
  const apiPath = workflowId === 'all'
    ? `repos/${env.repoSlug}/actions/runs?per_page=100`
    : `repos/${env.repoSlug}/actions/workflows/${workflowId}/runs?per_page=100`;
  const payload = ghApiJson(apiPath);
  return {
    totalCount: payload.total_count || 0,
    runs: (payload.workflow_runs || []).map((run) => ({
      id: run.id,
      workflowId: run.workflow_id,
      name: run.name,
      path: run.path,
      displayTitle: run.display_title,
      runNumber: run.run_number,
      runAttempt: run.run_attempt,
      event: run.event,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      sha: run.head_sha,
      createdAt: run.created_at,
      startedAt: run.run_started_at,
      updatedAt: run.updated_at,
      actor: run.actor?.login || '',
      htmlUrl: run.html_url,
      checkSuiteId: run.check_suite_id,
      workflowUrl: run.workflow_url,
      jobsUrl: run.jobs_url,
      logsUrl: run.logs_url
    }))
  };
}

function fetchRun(runId) {
  const env = loadConfig();
  const run = ghApiJson(`repos/${env.repoSlug}/actions/runs/${runId}`);
  return {
    id: run.id,
    workflowId: run.workflow_id,
    name: run.name,
    displayTitle: run.display_title,
    runNumber: run.run_number,
    runAttempt: run.run_attempt,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    branch: run.head_branch,
    sha: run.head_sha,
    actor: run.actor?.login || '',
    createdAt: run.created_at,
    startedAt: run.run_started_at,
    updatedAt: run.updated_at,
    htmlUrl: run.html_url,
    workflowPath: run.path,
    checkSuiteId: run.check_suite_id,
    workflowUrl: run.workflow_url,
    jobsUrl: run.jobs_url,
    logsUrl: run.logs_url,
    artifactsUrl: run.artifacts_url,
    headCommit: run.head_commit ? {
      id: run.head_commit.id,
      message: run.head_commit.message,
      timestamp: run.head_commit.timestamp,
      author: run.head_commit.author?.name || '',
      email: run.head_commit.author?.email || ''
    } : null
  };
}

function fetchRunJobs(runId) {
  const env = loadConfig();
  const payload = ghApiJson(`repos/${env.repoSlug}/actions/runs/${runId}/jobs?per_page=100`);
  return {
    totalCount: payload.total_count || 0,
    jobs: (payload.jobs || []).map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      htmlUrl: job.html_url,
      labels: job.labels || [],
      runnerName: job.runner_name || '',
      checkRunUrl: job.check_run_url,
      steps: (job.steps || []).map((step) => ({
        name: step.name,
        number: step.number,
        status: step.status,
        conclusion: step.conclusion,
        startedAt: step.started_at,
        completedAt: step.completed_at
      }))
    }))
  };
}

function fetchCheckRun(jobId) {
  const env = loadConfig();
  return ghApiJson(`repos/${env.repoSlug}/check-runs/${jobId}`);
}

function fetchJobAnnotations(jobId) {
  const env = loadConfig();
  return ghApiJson(`repos/${env.repoSlug}/check-runs/${jobId}/annotations?per_page=100`);
}

function fetchRunAnnotations(runId, jobs) {
  const resolvedJobs = Array.isArray(jobs) ? jobs : fetchRunJobs(runId).jobs;
  const annotations = [];
  for (const job of resolvedJobs) {
    let checkRun = null;
    try {
      checkRun = fetchCheckRun(job.id);
    } catch {
      checkRun = null;
    }
    let jobAnnotations = [];
    try {
      jobAnnotations = fetchJobAnnotations(job.id);
    } catch {
      jobAnnotations = [];
    }
    annotations.push({
      jobId: job.id,
      jobName: job.name,
      count: checkRun?.output?.annotations_count || jobAnnotations.length,
      summary: checkRun?.output?.summary || '',
      text: checkRun?.output?.text || '',
      items: (jobAnnotations || []).map((annotation) => ({
        path: annotation.path,
        startLine: annotation.start_line,
        endLine: annotation.end_line,
        level: annotation.annotation_level,
        title: annotation.title || '',
        message: annotation.message || '',
        details: annotation.raw_details || '',
        blobHref: annotation.blob_href || ''
      }))
    });
  }
  return annotations;
}

function fetchRunLogs(runId) {
  const env = loadConfig();
  const tmpZip = path.join(os.tmpdir(), `fallback-run-${runId}-${Date.now()}.zip`);
  try {
    const data = execFileSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', `repos/${env.repoSlug}/actions/runs/${runId}/logs`]);
    fs.writeFileSync(tmpZip, data);
    const fileList = execFileSync('unzip', ['-Z1', tmpZip], { encoding: 'utf8' })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return fileList.map((name) => ({
      name,
      content: execFileSync('unzip', ['-p', tmpZip, name], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
    }));
  } finally {
    if (fs.existsSync(tmpZip)) fs.rmSync(tmpZip, { force: true });
  }
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
  },
  async fetchActionsWorkflows() {
    return fetchWorkflows();
  },
  async fetchActionsRuns(workflowId) {
    return fetchWorkflowRuns(workflowId || 'all');
  },
  async fetchActionsRunDetail(runId) {
    const run = fetchRun(runId);
    const jobsPayload = fetchRunJobs(runId);
    const annotations = fetchRunAnnotations(runId, jobsPayload.jobs);
    const logs = fetchRunLogs(runId);
    return {
      run,
      jobs: jobsPayload.jobs,
      annotations,
      logs
    };
  },
  async openExternal(url) {
    await shell.openExternal(url);
    return true;
  }
});
