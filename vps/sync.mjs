// Sincroniza esta copia local con el VPS de folletos.
//   node vps/sync.mjs traer      -> copia las ediciones del VPS (textos + imágenes en uso) a ./data para verlas en local
//   node vps/sync.mjs respaldar  -> guarda esas ediciones en ./contenido y las sube a GitHub (commit + push)
//   node vps/sync.mjs publicar   -> el VPS hace git pull de GitHub y reconstruye el contenedor
// Requiere acceso SSH al VPS (FOLLETOS_SSH para cambiar el destino).
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const host = process.env.FOLLETOS_SSH || 'root@2.25.196.63';
const remoteDir = '/opt/folletos-huenu';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const contentDir = path.join(root, 'contenido');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} terminó con código ${code}`)));
  });
}

// Copia states/ y solo las imágenes que algún folleto usa (las reemplazadas quedan en el VPS, no se bajan).
async function download(targetDir) {
  await mkdir(targetDir, { recursive: true });
  console.log(`Trayendo ediciones desde ${host}:${remoteDir}/data ...`);
  const remote = `cd ${remoteDir}/data && { echo states; grep -ho 'brochure-images%2F[^"]*' states/*.json | sed 's#%2F#/#' | sort -u; } | tar -czf - -T -`;
  const ssh = spawn('ssh', ['-o', 'BatchMode=yes', host, remote], { stdio: ['ignore', 'pipe', 'inherit'] });
  const tar = spawn('tar', ['-xzf', '-'], { cwd: targetDir, stdio: ['pipe', 'inherit', 'inherit'] });
  ssh.stdout.pipe(tar.stdin);
  const done = (child, name) => new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${name} terminó con código ${code}`)));
  });
  await Promise.all([done(ssh, 'ssh'), done(tar, 'tar')]);
}

async function traer() {
  await download(dataDir);
  console.log('Listo: ./data quedó igual que el VPS.');
}

async function respaldar() {
  // Se vacía para que una imagen que ya no se usa también desaparezca del respaldo.
  await rm(path.join(contentDir, 'states'), { recursive: true, force: true });
  await rm(path.join(contentDir, 'brochure-images'), { recursive: true, force: true });
  await download(contentDir);
  git(['add', '-A', 'contenido']);
  if (!git(['status', '--porcelain', 'contenido'])) return console.log('Sin cambios: GitHub ya tiene este contenido.');
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  git(['commit', '-q', '-m', `Respaldo de contenido del VPS ${stamp}`, '--', 'contenido']);
  console.log('Subiendo a GitHub ...');
  await run('git', ['push', '-q', 'origin', 'HEAD'], { cwd: root });
  console.log(`Listo: contenido respaldado en GitHub (${git(['log', '-1', '--format=%h'])}).`);
}

async function publicar() {
  git(['fetch', '-q', 'origin']);
  const pendientes = git(['rev-list', '--count', 'origin/main..HEAD']);
  if (pendientes !== '0') throw new Error(`Hay ${pendientes} commit(s) locales sin subir. Hacé git push primero.`);
  console.log(`Publicando en ${host}: git pull + reconstruir contenedor ...`);
  await run('ssh', ['-o', 'BatchMode=yes', host,
    `cd ${remoteDir} && git pull --ff-only && git log -1 --format='VPS en %h %s' && docker compose -f vps/compose.yaml up -d --build`]);
}

const command = process.argv[2];
const commands = { traer, respaldar, publicar };
if (!commands[command]) {
  console.log('Uso: node vps/sync.mjs traer | respaldar | publicar');
  process.exit(1);
}
try { await commands[command](); }
catch (error) { console.error('Error:', error.message); process.exit(1); }
