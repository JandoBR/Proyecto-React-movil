import { execFileSync, spawn } from 'node:child_process';

let host = '';

try {
  host = execFileSync('tailscale', ['ip', '-4'], { encoding: 'utf8' })
    .split('\n')[0]
    .trim();
} catch {
  console.warn('tailscale: no se pudo leer la IP (¿Tailscale apagado?). Se usa el host por defecto.');
}

const env = { ...process.env };

if (host) {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
  console.log(`Dev server anunciado en la IP de Tailscale ${host}`);
}

const args = ['expo', 'start', '--host', 'lan', ...process.argv.slice(2)];
const child = spawn(args[0], args.slice(1), {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
