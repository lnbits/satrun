/* A single port-bound client; privileged calls never use iframe fetch. */
window.satBridge=async function(){
 const id=crypto.randomUUID(),channel=new MessageChannel();let seq=0;const pending=new Map();
 const connected=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('LNbits connection timed out. Reload to retry.')),12000);channel.port1.onmessage=({data})=>{if(data?.type==='lnbits-extension:connected'&&data.id===id){clearTimeout(timer);resolve();}else if(data?.type==='lnbits-extension:response'&&pending.has(data.id)){const item=pending.get(data.id);pending.delete(data.id);clearTimeout(item.timer);data.ok?item.resolve(data.data):item.reject(Error(data.error||'LNbits request failed.'));}};});
 window.parent.postMessage({type:'lnbits-extension:connect',id},new URL(location.href).origin,[channel.port2]);await connected;
 addEventListener('pagehide',()=>{channel.port1.close();for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('Page closed.'));}pending.clear();},{once:true});
 return {request(action,payload={}){return new Promise((resolve,reject)=>{const id=String(++seq),timer=setTimeout(()=>{pending.delete(id);reject(Error('LNbits request timed out.'));},20000);pending.set(id,{resolve,reject,timer});channel.port1.postMessage({type:'lnbits-extension:request',id,action,...payload});});}};
};
