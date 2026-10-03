// Sincroniza esta copia local con el VPS de folletos.
//   node vps/sync.mjs traer     -> copia las ediciones del VPS (data/states y data/brochure-images) a ./data
//   node vps/sync.mjs publicar  -> el VPS hace git pull de GitHub y reconstruye el contenedor
// Requiere acceso SSH al VPS (FOLLETOS_SSH para cambiar el destino).
import { spawn, execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const host = process.env.FOLLETOS_SSH || 'root@2.25.196.63';
const remoteDir = '/opt/folletos-huenu';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} terminó con código ${code}`)));
  });
}

async function traer() {
  await mkdir(dataDir, { recursive: true });
  console.log(`Trayendo ediciones desde ${host}:${remoteDir}/data ...`);
  const ssh = spawn('ssh', ['-o', 'BatchMode=yes', host, `tar -C ${remoteDir}/data -czf - states brochure-images`], { stdio: ['ignore', 'pipe', 'inherit'] });
  const tar = spawn('tar', ['-xzf', '-'], { cwd: dataDir, stdio: ['pipe', 'inherit', 'inherit'] });
  ssh.stdout.pipe(tar.stdin);
  const done = (child, name) => new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${name} terminó con código ${code}`)));
  });
  await Promise.all([done(ssh, 'ssh'), done(tar, 'tar')]);
  console.log('Listo: ./data quedó igual que el VPS.');
}

async function publicar() {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  git(['fetch', '-q', 'origin']);
  const pendientes = git(['rev-list', '--count', 'origin/main..HEAD']);
  if (pendientes !== '0') throw new Error(`Hay ${pendientes} commit(s) locales sin subir. Hacé git push primero.`);
  console.log(`Publicando en ${host}: git pull + reconstruir contenedor ...`);
  await run('ssh', ['-o', 'BatchMode=yes', host,
    `cd ${remoteDir} && git pull --ff-only && git log -1 --format='VPS en %h %s' && docker compose -f vps/compose.yaml up -d --build`]);
}

const command = process.argv[2];
const commands = { traer, publicar };
if (!commands[command]) {
  console.log('Uso: node vps/sync.mjs traer | publicar');
  process.exit(1);
}
try { await commands[command](); }
catch (error) { console.error('Error:', error.message); process.exit(1); }
