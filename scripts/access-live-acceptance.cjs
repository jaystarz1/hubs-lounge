// PARENT ONLY AFTER DEPLOY + IDLE PREFLIGHT. No media capture/production.
// Uses existing container PIN in memory; prints only sanitized acceptance flags.
const https=require('https'),fs=require('fs'),path=require('path'),WebSocket=require('ws');
const {releases}=require('./public-release');
const primary=process.env.PUBLIC_HOST,asset=primary.replace('lounge.','lounge-app.'),voice=primary.replace('lounge.','lounge-voice.');
let phase='configuration';
const roomPath=process.env.LOUNGE_ROOM_PATH,roomId=roomPath.split('/')[1],cookies={};
function request(host,url,method='GET',body,authorized=false,origin=host){return new Promise((resolve,reject)=>{
  const req=https.request({hostname:host,path:url,method,headers:{'User-Agent':'Owner-security-audit/1.0',Origin:'https://'+origin,'Content-Type':'application/x-www-form-urlencoded',...(authorized?{Cookie:cookies[host]}:{})}},res=>{
    let data='';res.on('data',c=>data+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:data}));
  });req.on('error',()=>reject(Error('HTTP transport failed')));req.end(body);
});}
function socket(host,kind,cookie,token,peerId){return new Promise((resolve,reject)=>{
  const url=kind==='presence'?`wss://${host}/socket/websocket?vsn=2.0.0`:`wss://${host}/?roomId=${roomId}&peerId=${peerId||'owner-invalid-audit'}`;
  const ws=new WebSocket(url,kind==='voice'?'protoo':[],{headers:{'User-Agent':'Owner-security-audit/1.0',...(cookie?{Cookie:cookie}:{})}});
  let finished=false;
  const finish=value=>{if(finished)return;finished=true;ws.terminate();resolve(value);};
  ws.on('unexpected-response',(_,res)=>{res.resume();finish({status:res.statusCode});});
  ws.on('error',()=>{if(!finished){finished=true;reject(Error('Socket transport failed'));}});
  ws.on('open',()=>{
    if(!cookie){finish({status:101});return;}
    if(kind==='presence')ws.send(JSON.stringify(['1','1',`hub:${roomId}`,'phx_join',{profile:{displayName:'Owner security audit'},context:{mobile:false,embed:false}}]));
    else ws.send(JSON.stringify({request:true,id:1,method:'join',data:{displayName:'Owner security audit',device:{},rtpCapabilities:{},sctpCapabilities:{},token:token||'invalid-audit-token'}}));
  });
  ws.on('message',raw=>{try{const m=JSON.parse(raw);
    if(kind==='presence'&&m[3]==='phx_reply')finish({status:101,ok:m[4].status==='ok',token:m[4].response?.perms_token,session:m[4].response?.session_id});
    if(kind==='voice'&&m.response&&m.id===1)finish({status:101,ok:m.ok===true});
  }catch{finished=true;ws.terminate();reject(Error('Socket parsing failed'));}});
  ws.on('close',()=>{if(!finished){finished=true;reject(Error('Socket closed without acceptance'));}});
});}

function originVoiceDenial(){return new Promise((resolve,reject)=>{
  const ws=new WebSocket(`wss://dialog:4443/?roomId=${roomId}&peerId=owner-origin-denial`, 'protoo', {rejectUnauthorized:false,headers:{Host:voice,'User-Agent':'Owner-security-audit/1.0'}});
  ws.on('unexpected-response',(_,response)=>{const status=response.statusCode;response.destroy();ws.terminate();resolve(status);});
  ws.on('open',()=>{ws.terminate();resolve(101);});
  ws.on('error',()=>reject(Error('Origin denial transport failed')));
});}

(async()=>{
  const assert=require('assert/strict');assert(primary&&process.env.LOUNGE_PIN&&roomPath);
  phase='anonymous-http';
  for(const host of [primary,asset])assert.equal((await request(host,'/')).status,401);
  phase='anonymous-presence';
  assert.equal((await socket(primary,'presence')).status,401);phase='anonymous-voice';const voiceDenied=(await socket(voice,'voice')).status;const originVoiceDenied=await originVoiceDenial();assert.equal(originVoiceDenied,401);assert([401,502].includes(voiceDenied));
  phase='pin-login';
  let response=await request(primary,'/_lounge/login','POST','pin='+encodeURIComponent(process.env.LOUNGE_PIN));
  for(let i=0;i<3;i++){
    phase='host-handoff-'+i;
    const host=[primary,asset,voice][i];assert.equal(response.status,200);
    const set=response.headers['set-cookie'][0];assert(set.startsWith('__Host-'));assert(!/Domain=/i.test(set));cookies[host]=set.split(';')[0];
    if(i<2){const next=[asset,voice][i],cap=response.body.match(/name="handoff" value="([a-f0-9]+)"/)[1];
      response=await new Promise((resolve,reject)=>{
        const req=https.request({hostname:next,path:'/_lounge/handoff',method:'POST',headers:{'User-Agent':'Owner-security-audit/1.0',Origin:'https://'+host,'Content-Type':'application/x-www-form-urlencoded'}},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',()=>reject(Error('Handoff failed')));req.end('handoff='+cap);
      });
    }
  }
  phase='authenticated-room';
  assert.equal((await request(primary,roomPath,'GET',null,true)).status,200);
  const base=path.resolve(__dirname,'..'),release=path.join(base,releases(base)[0]);
  function model(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){const found=model(p);if(found)return found;}else if(e.name.endsWith('.glb'))return p;}}
  const url='/'+path.relative(release,model(path.join(release,'assets')));
  phase='private-model';
  assert.equal((await request(asset,url)).status,401);assert.equal((await request(asset,url,'GET',null,true)).status,200);
  assert.equal((await request(asset,url,'HEAD',null,true)).status,200);
  phase='credentialed-cors-and-proxy';
  const cors=await request(asset,url,'HEAD',null,true,primary);assert.equal(cors.status,200);assert.equal(cors.body.length,0);assert.equal(cors.headers['access-control-allow-origin'],'https://'+primary);assert.equal(cors.headers['access-control-allow-credentials'],'true');
  assert.equal((await request(primary,'/_lounge/assets'+url,'HEAD',null,true)).status,200);
  phase='authenticated-presence';
  const presence=await socket(primary,'presence',cookies[primary]);assert(presence.ok&&presence.token&&presence.session);
  phase='authenticated-voice';
  assert((await socket(voice,'voice',cookies[voice],presence.token,presence.session)).ok);
  phase='invalid-voice-token';
  assert.equal((await socket(voice,'voice',cookies[voice],null,'owner-invalid-token-audit')).ok,false);
  console.log(JSON.stringify({deployed_acceptance:'pass',anonymous_primary_asset:401,anonymous_presence:401,anonymous_voice_public:voiceDenied,anonymous_voice_origin:originVoiceDenied,existing_pin_and_host_handoffs:'pass',private_room_and_model:200,head_model:200,credentialed_asset_cors:'pass',same_origin_asset_proxy:'pass',authenticated_phoenix_join:'pass',authenticated_voice_join:'pass',invalid_voice_token:'rejected'}));
})().catch(error=>{console.error(JSON.stringify({live_acceptance:'failed',phase,error_type:error.code||error.name,actual:typeof error.actual==='number'?error.actual:undefined,expected:typeof error.expected==='number'?error.expected:undefined}));process.exitCode=1;});
