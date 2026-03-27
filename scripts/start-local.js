const { spawn } = require('child_process');

function run(name, command, args, options = {}) {
  const cp = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options, shell: true });

  cp.stdout.on('data', (data) => {
    process.stdout.write(`[${name} stdout] ${data}`);
  });
  cp.stderr.on('data', (data) => {
    process.stderr.write(`[${name} stderr] ${data}`);
  });
  cp.on('exit', (code, signal) => {
    console.log(`[${name}] exited with code ${code}${signal ? ` signal ${signal}` : ''}`);
  });

  return cp;
}

console.log('Starting local NeuroOps stack...');

const backend = run('backend', 'node', ['mock-backend.js'], { cwd: process.cwd() });
const frontend = run('frontend', 'python', ['-m', 'http.server', '8080'], { cwd: `${process.cwd()}\\frontend\\public` });

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, stopping local stack...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, stopping local stack...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
});

// keep main process alive
setInterval(() => {}, 1000);
