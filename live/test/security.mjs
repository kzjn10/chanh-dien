import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chanh-test-'));
const port=31879, token='test-only-control-token';
let output='';
const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,HOST:"127.0.0.1",PORT:String(port),CONTROL_TOKEN:token,TTS_DIR:temp}});
child.stdout.on('data',x=>output+=x); child.stderr.on('data',x=>output+=x);
const base=`http://127.0.0.1:${port}`;
async function socket(query='',origin){const w=new WebSocket(`ws://127.0.0.1:${port}/ws${query}`,origin?{origin}:{});await once(w,'open');return w;}
await test('security integration',async t=>{
try {
for(let i=0;i<600;i++){try{await fetch(base);break;}catch{await new Promise(r=>setTimeout(r,50));}}
assert.equal(child.exitCode,null,output);
await t.test('control requires token',async()=>{await assert.rejects(socket('?role=control'),/401/); await assert.rejects(socket('?role=control&token=wrong'),/401/);});
await t.test('foreign origin rejected',async()=>{await assert.rejects(socket('', 'https://evil.example'),/401/); await assert.rejects(socket('', `https://127.0.0.1:${port}`),/401/);});
await t.test('static files restricted',async()=>{for(const p of ['/live/server.mjs','/live/package.json','/live/test/security.mjs'])assert.equal((await fetch(base+p)).status,404);});
await t.test('valid control chat command',async()=>{const w=await socket(`?role=control&token=${token}`);const received=new Promise(resolve=>w.on('message',b=>{const m=JSON.parse(b);if(m.t==='join')resolve(m);}));w.send(JSON.stringify({t:'ctl',cmd:'chat',name:'Test',text:'nam'}));assert.equal((await received).v.name,'Test');w.terminate();});
await t.test('overlay cannot issue control commands',async()=>{const w=await socket();let changed=false;w.on('message',b=>{if(JSON.parse(b).t==='settings')changed=true;});w.send(JSON.stringify({t:'ctl',cmd:'settings',settings:{title:'ATTACK'}}));await new Promise(r=>setTimeout(r,100));w.terminate();assert.equal(changed,false);});
await t.test('UI and assets load with framing protection',async()=>{for(const p of ['/live/control.html','/live/overlay.html','/assets/hall-banyan.png','/assets/music/music1.mp3']){const r=await fetch(base+p);assert.equal(r.status,200);assert.equal(r.headers.get('x-frame-options'),'DENY');await r.arrayBuffer();}});
await t.test('backup files and escaping symlinks are blocked',async()=>{const backup=new URL('../test-backup.bak',import.meta.url),link=new URL('../../assets/security-test.png',import.meta.url);fs.writeFileSync(backup,'test');const outside=path.join(temp,'outside.png');fs.writeFileSync(outside,'private');fs.symlinkSync(outside,link);try{assert.equal((await fetch(base+'/live/test-backup.bak')).status,404);assert.equal((await fetch(base+'/assets/security-test.png')).status,404);}finally{fs.unlinkSync(backup);fs.unlinkSync(link);}});
await t.test('oversize frame does not crash server',async()=>{const w=await socket();w.on('error',()=>{});const closed=once(w,'close');w.send('x'.repeat(70000));await closed;assert.equal((await fetch(base)).status,200);});
await t.test('control flood is disconnected',async()=>{const w=await socket(`?role=control&token=${token}`);const closed=once(w,'close');for(let i=0;i<50;i++)w.send('{"t":"ctl","cmd":"mo"}');const timer=setTimeout(()=>w.terminate(),1500);const [code]=await closed;clearTimeout(timer);assert.equal(code,1008);});
} finally {child.kill(); fs.rmSync(temp,{recursive:true,force:true});}
});
