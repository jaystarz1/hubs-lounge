// In-memory admission authority; existing PIN is never serialized or changed.
const crypto = require('crypto');
const COOKIE = '__Host-lounge_session';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const random = () => crypto.randomBytes(32).toString('hex');
// The PIN page has its own big number pad: the Quest browser's pop-up
// keyboard doesn't always come up for the box (Jay, 2026-10-20).
const FORM = '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private Lounge</title><style>body{font-family:sans-serif;background:#14181c;color:#f4efe2;text-align:center;margin:0;padding:3vh 4vw}h1{font-size:6vh;margin:1vh 0}input{font-size:6vh;width:60vw;text-align:center;padding:1vh;border-radius:1vh;border:0}#pad{display:grid;grid-template-columns:repeat(3,1fr);gap:2vh;max-width:70vh;margin:3vh auto}#pad button,#go{font-size:7vh;padding:2vh 0;border-radius:1.5vh;border:0;background:#2f3a44;color:#fff}#go{background:#3a8a4a;width:100%}</style><body><h1>Private Lounge</h1><form method="post" action="/_lounge/login"><input name="pin" type="password" inputmode="numeric" autocomplete="off" required maxlength="128" placeholder="PIN"><div id="pad"></div><button id="go">Enter</button></form><script>(function(){var f=document.forms[0],i=f.pin,p=document.getElementById("pad");["1","2","3","4","5","6","7","8","9","Clear","0","Back"].forEach(function(k){var b=document.createElement("button");b.type="button";b.textContent=k;b.onclick=function(){if(k==="Clear")i.value="";else if(k==="Back")i.value=i.value.slice(0,-1);else i.value+=k};p.appendChild(b)})})()</script></body></html>';
function createAccessGate({pin,roomPath,publicHost,internalAllowed=()=>false,relayHost=()=>null,now=Date.now,verifyTv=async()=>false}) {
  const primary=`https://${publicHost}`;
  const assets=primary.replace('lounge.','lounge-app.');
  const voice=primary.replace('lounge.','lounge-voice.');
  const origins=[primary,assets,voice];
  const sessions=new Map(), handoffs=new Map(), attempts=[];
  const cleanup=()=>{for(const map of [sessions,handoffs])for(const [key,value] of map)if(value.expires<=now())map.delete(key);};
  const boundedSet=(map,key,value)=>{cleanup();if(map.size>=256)map.delete(map.keys().next().value);map.set(key,value);};
  const valid=(cookie,audience=primary)=>{
    const values=String(cookie||'').split(';').map(p=>p.trim().split('=')).filter(([k])=>k===COOKIE);
    if(values.length!==1 || !/^[a-f0-9]{64}$/.test(values[0][1]||''))return false;
    const session=sessions.get(digest(values[0][1]));
    return !!session && session.expires>now() && session.audience===audience;
  };
  const send=(req,res,status,body='',extra={})=>{
    res.writeHead(status,{'Cache-Control':'no-store','Vary':'Cookie, Origin','Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin',...extra});
    res.end(req.method==='HEAD'?'':body);return true;
  };
  const read=async req=>{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2048)throw Error('large body');}return new URLSearchParams(body);};
  const issue=(req,res,audience,next,fragment='',expires=now()+12*3600000)=>{
    const token=random();boundedSet(sessions,digest(token),{audience,expires});
    const headers={'Set-Cookie':`${COOKIE}=${token}; Path=/; Max-Age=${Math.max(0,Math.floor((expires-now())/1000))}; HttpOnly; Secure; SameSite=Strict`};
    if(next.length){
      const cap=random();boundedSet(handoffs,digest(cap),{audience:next[0],next:next.slice(1),fragment,expires:now()+30000,sessionExpires:expires});
      return send(req,res,200,`<!doctype html><title>Opening Lounge</title><form method="post" action="${next[0]}/_lounge/handoff"><input type="hidden" name="handoff" value="${cap}"></form><script>document.forms[0].submit()</script>`,headers);
    }
    // Commit a real same-site document before navigation (required by Strict
    // cookies when TV starts from a local data: document). Fragment is never logged.
    const target=JSON.stringify(primary+roomPath+fragment).replace(/</g,'\\u003c');
    return send(req,res,200,`<!doctype html><title>Opening Lounge</title><script>location.replace(${target})</script>`,headers);
  };
  const gate=async(req,res)=>{
    let url;try{url=new URL(req.url,primary);}catch{return send(req,res,400);}
    const pathname=url.pathname;
    const host=relayHost(req)||req.headers.host;
    const audience=origins.find(o=>new URL(o).host===host);
    if(pathname==='/_lounge/health')return send(req,res,200,'ready');
    if(pathname==='/' && ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress) && /^(localhost|127\.0\.0\.1):8080$/.test(req.headers.host||''))return send(req,res,200,'ready');
    if(pathname==='/_lounge/validate'){
      if(!['GET','HEAD'].includes(req.method))return send(req,res,405);
      return send(req,res,valid(req.headers.cookie,url.searchParams.get('audience')||assets)?204:401);
    }
    if(['/_lounge/login','/_lounge/tv','/_lounge/handoff'].includes(pathname) && req.method==='POST'){
      if(!audience)return send(req,res,403);
      let data;
      if(pathname==='/_lounge/login'){
        if(req.headers.origin!==audience)return send(req,res,403);
        while(attempts.length && attempts[0]<=now()-60000)attempts.shift();
        if(attempts.length>=10)return send(req,res,429,'Wait one minute',{'Retry-After':'60'});
        attempts.push(now());
      }
      try{data=await read(req);}catch{return send(req,res,413);}
      if(pathname==='/_lounge/handoff'){
        if(!origins.includes(req.headers.origin))return send(req,res,403);
        const cap=data.get('handoff')||'';
        const value=handoffs.get(digest(cap));
        if(!value || value.expires<=now() || value.audience!==audience)return send(req,res,401);
        handoffs.delete(digest(cap));
        return issue(req,res,audience,value.next,value.fragment,value.sessionExpires);
      }
      if(pathname==='/_lounge/tv'){
        const token=data.get('tv_token');
        if(audience!==primary || !/^[a-f0-9]{64}$/.test(token||'') || !await verifyTv(token))return send(req,res,401);
        return issue(req,res,audience,[assets,voice],`?tv=1#tv-session=${token}`);
      }
      if(!pin)return send(req,res,503);
      if(digest(data.get('pin')||'')!==digest(pin))return send(req,res,401,FORM);
      return issue(req,res,audience,origins.filter(o=>o!==audience));
    }
    if(pathname==='/_lounge/login' && ['GET','HEAD'].includes(req.method))return send(req,res,401,FORM);
    if(['/_lounge/login','/_lounge/tv','/_lounge/handoff'].includes(pathname))return send(req,res,405);
    if(internalAllowed(req))return false;
    if(!audience || !valid(req.headers.cookie,audience))return send(req,res,401,req.method==='GET'&&!pathname.startsWith('/api')?FORM:'Authentication required');
    if(pathname.startsWith('/_lounge/') && pathname!=='/_lounge/runtime.js' && !(pathname==='/_lounge/telemetry' && req.method==='POST') && !pathname.startsWith('/_lounge/assets/'))return send(req,res,405);
    if(pathname==='/'||pathname==='/index.html')return send(req,res,303,'',{Location:primary+roomPath});
    return false;
  };
  gate.valid=valid;
  return gate;
}
module.exports={createAccessGate,COOKIE};
