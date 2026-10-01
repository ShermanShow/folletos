import {randomBytes, scryptSync} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';

let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/[\r\n]+$/, '');
if (password.length < 20) throw new Error('Password must have at least 20 characters');
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
const file = path.join(path.resolve(process.env.DATA_DIR || '/app/data'), 'auth.json');
await writeFile(file, JSON.stringify({user:'folletos',salt:salt.toString('hex'),hash:hash.toString('hex')}), {flag:'wx',mode:0o600});
console.log('Editor credentials initialized');
