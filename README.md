# GitHub Actions Fallback Desktop

Electron + React desktop monitor for the WSL-hosted `github-actions-fallback` runner.

## Features

- polls the local fallback runner `/status` endpoint
- shows busy/error/last-result state
- tails the local runner and reverse tunnel logs
- triggers manual deploys for `main` or `svc/**` refs

## Run

```bash
cd /home/faagm24/projects/github-actions-fallback-desktop
npm install
npm run dev
```

## Build

```bash
npm run build
```
