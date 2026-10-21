// Read-only protocol probe: does not enter a room or produce media.
const WebSocket = require('ws');
const room = process.env.LOUNGE_ROOM_PATH.split('/')[1];
function probe(kind, url) {
  return new Promise(resolve=>{
    const ws=new WebSocket(url,kind==='voice'?'protoo':[],{rejectUnauthorized:false,headers:{'User-Agent':'Owner-security-audit/1.0'}});
    let done=false;
    function finish(result){if(done)return;done=true;console.log(JSON.stringify({kind,...result}));ws.terminate();resolve();}
    ws.on('unexpected-response',(_,res)=>{res.resume();finish({status:res.statusCode,upgrade:false});});
    ws.on('error',()=>finish({error:true}));
    ws.on('open',()=>{
      if(kind==='presence')ws.send(JSON.stringify(['1','1',`hub:${room}`,'phx_join',{profile:{displayName:'Owner security audit'},context:{mobile:false,embed:false}}]));
      else ws.send(JSON.stringify({request:true,id:1,method:'join',data:{displayName:'Owner security audit',device:{},rtpCapabilities:{},sctpCapabilities:{},token:'invalid-audit-token'}}));
    });
    ws.on('message',raw=>{
      try{const m=JSON.parse(raw);
        if(kind==='presence'&&m[3]==='phx_reply')finish({upgrade:true,joinStatus:m[4].status,privateHub:!!m[4].response?.hub,permissionToken:!!m[4].response?.perms_token,responseKeys:Object.keys(m[4].response||{}).filter(k=>['hub','perms_token','session_id','presence'].includes(k))});
        if(kind==='voice'&&m.response&&m.id===1)finish({upgrade:true,invalidJoinAccepted:m.ok===true,peerCount:Array.isArray(m.data?.peers)?m.data.peers.length:null});
      }catch{finish({parseError:true});}
    });
    ws.on('close',()=>finish({closed:true}));
  });
}
(async()=>{
 await probe('presence','wss://lounge.thechatbotgenius.com/socket/websocket?vsn=2.0.0');
 await probe('voice',`wss://lounge-voice.thechatbotgenius.com/?roomId=${room}&peerId=owner-readonly-audit`);
})().catch(()=>{console.error('Protocol audit failed; details suppressed');process.exitCode=1;});
