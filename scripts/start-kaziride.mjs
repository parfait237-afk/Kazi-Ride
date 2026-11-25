import { spawn } from 'node:child_process';

const processes = [];
function launch(command, args) {
  const child = spawn(command, args, { cwd: process.cwd(), stdio: 'inherit', shell: true, env: process.env });
  processes.push(child);
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`Un service KaziRide s’est arrêté avec le code ${code}.`);
  });
  return child;
}

launch('npm', ['--prefix', 'backend', 'run', 'dev']);
launch('npx', ['expo', 'start', '--lan', '--clear', '--port', '8083']);

function stop() {
  for (const child of processes) if (!child.killed) child.kill('SIGTERM');
  setTimeout(() => process.exit(0), 250);
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
