const { execFileSync, spawn } = require('child_process');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const defaultPort = process.env.PORT || '3002';

function run(command, args) {
  return execFileSync(command, args, {
    cwd: backendRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function listPidsForPort(port) {
  try {
    const output = run('lsof', ['-ti', `:${port}`]);
    return output
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function commandForPid(pid) {
  try {
    return run('ps', ['-p', pid, '-o', 'command=']);
  } catch (error) {
    return '';
  }
}

function isBackendOwnedProcess(command) {
  return (
    command.includes('/backend/dist/main') ||
    command.includes('/backend/node_modules/.bin/nest') ||
    command.includes('nest start')
  );
}

function waitForExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      process.kill(Number(pid), 0);
    } catch (error) {
      return true;
    }
  }

  return false;
}

function ensurePortIsFree(port) {
  const pids = listPidsForPort(port);
  if (pids.length === 0) {
    return;
  }

  for (const pid of pids) {
    const command = commandForPid(pid);

    if (!isBackendOwnedProcess(command)) {
      console.error(`Port ${port} is already in use by another process: ${command || pid}`);
      console.error('Stop that process manually or change PORT in backend/.env before starting the backend.');
      process.exit(1);
    }

    console.log(`Stopping stale backend process on port ${port}: PID ${pid}`);
    try {
      process.kill(Number(pid), 'SIGTERM');
    } catch (error) {
      continue;
    }

    if (!waitForExit(pid, 3000)) {
      console.log(`Force stopping backend process ${pid}`);
      try {
        process.kill(Number(pid), 'SIGKILL');
      } catch (error) {
        // Ignore race conditions if the process exits between signals.
      }
    }
  }
}

ensurePortIsFree(defaultPort);

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['nest', 'start', '--watch'],
  {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

