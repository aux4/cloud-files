import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {uploadedChannelFile} from '../package/lib/channel-upload-input.mjs';
const headers={'content-type':'multipart/form-data; boundary=test'};
test('only genuine multipart descriptor shape and confined temporary uploads are accepted',async()=>{
 const dir=join(tmpdir(),'aux4-api',randomUUID());await mkdir(dir,{recursive:true});
 try{
  const path=join(dir,'note.txt');await writeFile(path,'hello');const body={file:[{filename:'note.txt',path,mimeType:'text/plain'}]};
  assert.equal((await uploadedChannelFile(body,headers)).data,Buffer.from('hello').toString('base64'));
  await assert.rejects(uploadedChannelFile(body,{'content-type':'application/json'}));
  await assert.rejects(uploadedChannelFile({file:JSON.stringify(body.file)},headers));
  await assert.rejects(uploadedChannelFile({file:[{filename:'passwd',path:'/etc/passwd'}]},headers));
  await assert.rejects(uploadedChannelFile({file:[{filename:'../note.txt',path}]},headers));
  await symlink(path,join(dir,'link.txt'));
  await assert.rejects(uploadedChannelFile({file:[{filename:'link.txt',path:join(dir,'link.txt')}]},headers));
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('personal Files upload also rejects JSON paths and accepts validated multipart descriptors',async()=>{
 const {execFile}=await import('node:child_process');
 const {promisify}=await import('node:util');
 const run=promisify(execFile);
 const dir=join(tmpdir(),'aux4-api',randomUUID());await mkdir(dir,{recursive:true});
 try{
  const path=join(dir,'personal.txt');await writeFile(path,'personal bytes');
  const files=JSON.stringify([{filename:'personal.txt',path,mimeType:'text/plain'}]);
  const script=new URL('../package/lib/cloud-files-app.mjs',import.meta.url).pathname;
  const denied=JSON.parse((await run('node',[script,'upload',JSON.stringify({sub:'alice'}),'docs',files,'{}'],{env:{...process.env,CLOUD_FILES_WRITE_FIXTURE:'ok'}})).stdout);
  assert.equal(denied.error,'A multipart file is required.');
  const accepted=JSON.parse((await run('node',[script,'upload',JSON.stringify({sub:'alice'}),'docs',files,JSON.stringify(headers)],{env:{...process.env,CLOUD_FILES_WRITE_FIXTURE:'ok'}})).stdout);
  assert.equal(accepted.message,'Uploaded 1 file');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('personal and shared Files actions reject anonymous calls even with server credentials present',async()=>{
 const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const run=promisify(execFile);
 const script=new URL('../package/lib/cloud-files-app.mjs',import.meta.url).pathname;
 const env={...process.env,AUX4_ACCESS_TOKEN:'misconfigured-global-token',CLOUD_FILES_LIST_FIXTURE:'{"files":[{"name":"secret.txt"}]}',CLOUD_FILES_WRITE_FIXTURE:'ok',CLOUD_FILES_DOWNLOAD_FIXTURE:'private'};
 for(const action of ['browse','create-folder','upload','download','delete']){
  const result=JSON.parse((await run('node',[script,action,'{}','docs'],{env})).stdout);
  assert.match(result.error,/Sign in/);assert.ok(!JSON.stringify(result).includes('secret.txt'));
 }
 const {channelFilesAction}=await import('../package/lib/channel-files-cli.mjs');
 for(const action of ['folders','browse','upload','download','resolve','publish']){
  const result=await channelFilesAction(action,'{}','{}','{}','/tmp/security-test-unused','{}');assert.equal(result.statusCode,403);
 }
});
