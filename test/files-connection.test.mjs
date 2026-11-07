import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {filesConnection,serviceUrl,serviceRequest,serviceJson} from '../package/lib/files-connection.mjs';

test('connection selection is explicit and rejects unsafe or incomplete destinations', () => {
  assert.deepEqual(filesConnection({}), {backend:'local'});
  assert.deepEqual(filesConnection({FILES_BACKEND:'cloud',FILES_SERVICE_URL:'https://files.example.test/'}),{backend:'cloud',url:'https://files.example.test'});
  for(const config of [{FILES_BACKEND:'wrong'},{FILES_BACKEND:'cloud'},{FILES_BACKEND:'cloud',FILES_SERVICE_URL:'http://files.example.test'}]) assert.throws(()=>filesConnection(config));
  for(const url of ['https://user:password@example.test','https://files.example.test/?token=x','https://files.example.test/#x','file:///tmp/files']) assert.throws(()=>serviceUrl(url));
  assert.equal(serviceUrl('http://127.0.0.1:9999'),'http://127.0.0.1:9999');
});

test('remote transport requires delegated identity, bounds responses and refuses redirects', async () => {
  const requests=[];
  const server=createServer((req,res)=>{
    requests.push({path:req.url,authorization:req.headers.authorization});
    if(req.url==='/redirect'){res.writeHead(302,{Location:'/unexpected'});return res.end();}
    if(req.url==='/large')return res.end('x'.repeat(2000));
    if(req.url==='/denied'){res.writeHead(403);return res.end('{"secret":"internal"}');}
    res.setHeader('content-type','application/json');res.end('{"ok":true}');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try {
    await assert.rejects(serviceRequest(base,'/',{token:''}),/signed-in user/);assert.equal(requests.length,0);
    assert.deepEqual(await serviceJson(base,'/',{token:'delegated-test',body:{channelId:'room'}}),{ok:true});
    assert.equal(requests[0].authorization,'Bearer delegated-test');
    await assert.rejects(serviceRequest(base,'/redirect',{token:'delegated-test'}));assert.ok(!requests.some(r=>r.path==='/unexpected'));
    await assert.rejects(serviceRequest(base,'/large',{token:'delegated-test',maxBytes:100}),/size limit/);
    await assert.rejects(serviceRequest(base,'/denied',{token:'delegated-test'}),/access denied/);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('Files rejects a Chat authorization response for a different user', async () => {
  const {channelFilesService}=await import('../package/lib/channel-files-service.mjs');
  const server=createServer((req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({authorized:true,channelId:'room',userId:'different-user'}));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const keys=['FILES_BACKEND','FILES_CHAT_SERVICE_URL','AUX4_ACCESS_TOKEN'];const saved=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{FILES_BACKEND:'local',FILES_CHAT_SERVICE_URL:`http://127.0.0.1:${server.address().port}`,AUX4_ACCESS_TOKEN:'test-token'});
  try {
    const store=await channelFilesService('/tmp/security-test-unused');
    await assert.rejects(store.upload({principal:{sub:'alice'},channelId:'room',name:'test.txt',data:Buffer.from('private').toString('base64')}),/not found|no longer/);
  } finally {for(const [key,value] of Object.entries(saved))if(value===undefined)delete process.env[key];else process.env[key]=value;await new Promise(resolve=>server.close(resolve));}
});
