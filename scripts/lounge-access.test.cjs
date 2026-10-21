const test=require('node:test'), assert=require('node:assert/strict'),http=require('node:http');
const {createAccessGate,COOKIE}=require('./lounge-access.cjs');
async function fixture(run){
  let time=0;
  const primary='https://lounge.example.test',assets=primary.replace('lounge.','lounge-app.'),voice=primary.replace('lounge.','lounge-voice.');
  const gate=createAccessGate({pin:'fixture-pin',roomPath:'/fixture/room',publicHost:'lounge.example.test',now:()=>time,verifyTv:async t=>t==='f'.repeat(64)});
  const server=http.createServer(async(req,res)=>{if(await gate(req,res))return;res.end('private fixture');});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const call=(origin,path,method='GET',body,cookie,source=origin)=>new Promise((resolve,reject)=>{
    const req=http.request({host:'127.0.0.1',port:server.address().port,path,method,headers:{host:new URL(origin).host,origin:source,...(cookie?{cookie}:{})}},r=>{
      let text='';r.on('data',c=>text+=c);r.on('end',()=>resolve({status:r.statusCode,headers:{get:k=>Array.isArray(r.headers[k])?r.headers[k].join(','):r.headers[k]},text:async()=>text}));
    });req.on('error',reject);req.end(body);
  });
  const cookie=r=>r.headers.get('set-cookie').split(';')[0];
  const cap=async r=>(await r.text()).match(/name="handoff" value="([a-f0-9]+)"/)[1];
  try{await run({call,primary,assets,voice,cookie,cap,advance:ms=>time+=ms});}finally{await new Promise(r=>server.close(r));}
}
test('all anonymous HTTP methods deny before private serialization on all hosts',()=>fixture(async({call,primary,assets,voice})=>{
  for(const host of [primary,assets,voice])for(const method of ['GET','HEAD','POST','PUT','OPTIONS','DELETE']){
    const r=await call(host,'/assets/private.glb',method);assert.equal(r.status,401);assert.equal(r.headers.get('cache-control'),'no-store');assert(!(await r.text()).includes('private fixture'));
  }
}));
test('host-only audience-bound cookies; one-use host handoff; invalid and expired denial',()=>fixture(async({call,primary,assets,voice,cookie,cap,advance})=>{
  assert.equal((await call(primary,'/_lounge/login','POST','pin=wrong')).status,401);
  assert.equal((await call(primary,'/_lounge/login','POST','pin=fixture-pin',null,'https://evil.test')).status,403);
  const login=await call(primary,'/_lounge/login','POST','pin=fixture-pin');assert.equal(login.status,200);
  const header=login.headers.get('set-cookie');assert(header.startsWith(COOKIE+'='));assert(!/Domain=/i.test(header));assert(header.includes('HttpOnly; Secure; SameSite=Strict'));
  const main=cookie(login),handoff=await cap(login);
  assert.equal((await call(primary,'/private','GET',null,main)).status,200);
  assert.equal((await call(assets,'/private','GET',null,main)).status,401);
  assert.equal((await call(primary,'/private','GET',null,main+'x')).status,401);
  const asset=await call(assets,'/_lounge/handoff','POST','handoff='+handoff,null,primary);assert.equal(asset.status,200);
  assert.equal((await call(assets,'/_lounge/handoff','POST','handoff='+handoff,null,primary)).status,401);
  assert.equal((await call(assets,'/private','GET',null,cookie(asset))).status,200);
  const next=await cap(asset);advance(30001);
  assert.equal((await call(voice,'/_lounge/handoff','POST','handoff='+next,null,assets)).status,401);
  advance(12*3600000);
  assert.equal((await call(primary,'/private','GET',null,main)).status,401);
}));
test('TV capability bootstrap and PIN throttling retain denial',()=>fixture(async({call,primary})=>{
  assert.equal((await call(primary,'/_lounge/tv','POST','tv_token='+'a'.repeat(64))).status,401);
  assert.equal((await call(primary,'/_lounge/tv','POST','tv_token='+'f'.repeat(64))).status,200);
  for(let i=0;i<10;i++)await call(primary,'/_lounge/login','POST','pin=wrong');
  assert.equal((await call(primary,'/_lounge/login','POST','pin=fixture-pin')).status,429);
}));test('telemetry POST passes the gate only with a valid session',()=>fixture(async({call,primary,assets,cookie,cap})=>{
  assert.equal((await call(assets,'/_lounge/telemetry','POST','{"recs":[]}')).status,401);
  const login=await call(primary,'/_lounge/login','POST','pin=fixture-pin');
  const main=cookie(login);
  assert.equal((await call(primary,'/_lounge/telemetry','POST','{"recs":[]}',main)).status,200);
  assert.equal((await call(primary,'/_lounge/telemetry','GET',null,main)).status,405);
  assert.equal((await call(primary,'/_lounge/other','POST','x',main)).status,405);
}));
