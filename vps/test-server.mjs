import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes, scryptSync} from 'node:crypto';
import assert from 'node:assert/strict';

const temp=await mkdtemp(path.join(tmpdir(),'folletos-vps-test-'));
const publicDir=path.join(temp,'public'),dataDir=path.join(temp,'data');
await mkdir(publicDir);await mkdir(dataDir);
await writeFile(path.join(publicDir,'index.html'),'<h1>Folletos test</h1>');
const password='test-password-at-least-20-characters';
const salt=randomBytes(16);
await writeFile(path.join(dataDir,'auth.json'),JSON.stringify({user:'folletos',salt:salt.toString('hex'),hash:scryptSync(password,salt,32).toString('hex')}));
const port=38000+Math.floor(Math.random()*10000);
const child=spawn(process.execPath,[path.resolve('vps/server.mjs')],{env:{...process.env,PUBLIC_DIR:publicDir,DATA_DIR:dataDir,PORT:String(port)},stdio:'ignore'});
const base=`http://127.0.0.1:${port}`;
try{
  for(let i=0;i<50;i++){
    try {await fetch(base);break;}catch{await new Promise(r=>setTimeout(r,100));}
  }
  assert.equal((await fetch(base)).status,401);
  const headers={Authorization:'Basic '+Buffer.from('folletos:'+password).toString('base64')};
  assert.equal((await fetch(base,{headers})).status,200);
  assert.equal((await fetch(base+'/api/state?key=test_p1',{headers})).status,404);
  const state={photo:{width:100,height:40,src:'/api/image?path=brochure-images%2Fexample.png'}};
  assert.equal((await fetch(base+'/api/state?key=test_p1',{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({state})})).status,200);
  const saved=await (await fetch(base+'/api/state?key=test_p1',{headers})).json();
  assert.deepEqual(saved.state,state);
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=','base64');
  const uploaded=await (await fetch(base+'/api/image?key=photo',{method:'PUT',headers:{...headers,'Content-Type':'image/png'},body:image})).json();
  assert.ok(uploaded.url.startsWith('/api/image?path='));
  assert.deepEqual(Buffer.from(await (await fetch(base+uploaded.url,{headers})).arrayBuffer()),image);
  console.log('VPS server: auth, static, state, image OK');
}finally{
  child.kill();
  if(temp.startsWith(path.resolve(tmpdir())+path.sep))await rm(temp,{recursive:true,force:true});
}
