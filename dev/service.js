import {packReplay,unpackReplay} from './replay-proof.js';
import {newRun,resumeRun,padFor,packState,score} from './physics.js';
export const DEFAULTS={continueEnabled:false,continuePrice:21,checkpointFrequency:10,difficulty:1,dailyChallenge:true,leaderboardEnabled:true};
class InputError extends Error{}
function fail(message){throw new InputError(message);}
function object(v){if(!v||typeof v!=='object'||Array.isArray(v))fail('Expected a JSON object.');return v;}
function integer(v,min,max,name){if(!Number.isInteger(v)||v<min||v>max)fail('Invalid '+name+'.');return v;}
function id(v){if(typeof v!=='string'||!/^[a-zA-Z0-9_-]{8,90}$/.test(v))fail('Invalid reference.');return v;}
function bool(v){if(typeof v!=='boolean')fail('Expected true or false.');return v;}
export function validateRecord(v){object(v);const out={bestFloor:integer(v.bestFloor,0,100000,'floor'),bestScore:integer(v.bestScore,0,1000000000,'score'),totalTime:integer(v.totalTime,0,1000000000,'total time'),runs:integer(v.runs,0,100000000,'runs'),milestones:{}};object(v.milestones||{});for(const [k,t]of Object.entries(v.milestones||{})){integer(Number(k),1,100000,'milestone');if(!Number.isFinite(t)||t<0||t>86400)fail('Invalid milestone time.');out.milestones[k]=t;}if(Object.keys(out.milestones).length>100)fail('Too many milestones.');return out;}
const blank=()=>({bestFloor:0,bestScore:0,totalTime:0,runs:0,milestones:{}});
export function createService(h){
 const first=table=>h.first(table),get=(table,id)=>h.get(table,id),pub=(table,id)=>h.publicGet(table,id),day=()=>new Date(h.now()*1000).toISOString().slice(0,10);
 const view=row=>({id:row.id,continueEnabled:row.continue_enabled,continuePrice:row.continue_price,checkpointFrequency:row.checkpoint_frequency,difficulty:row.difficulty,dailyChallenge:row.daily_challenge,leaderboardEnabled:row.leaderboard_enabled});
 function tower(ref){const t=pub('towers',id(ref));if(!t)fail('Tower not found.');return t;}
 function node(p,privateRead=false){const n=(privateRead?get:pub)('run_nodes',id(p.runId));if(!n||n.token!==p.token)fail('Invalid run token.');return n;}
 function saveNode(n,s){const fields={token:n.token,root_id:n.root_id,day:n.day,started:n.started,name:n.name,state_json:packReplay(s),resume_key:n.resume_key||'',signing_key:n.signing_key||''};return h.append('run_nodes',n.tower_id,fields);}
 const ops={
 gameInfo:()=>({version:'0.1.0',day:day(),settings:DEFAULTS,secondsUntilReset:86400-h.now()%86400}),
 getRecord:()=>({record:JSON.parse(first('records')?.record_json||JSON.stringify(blank()))}),
 saveRecord:p=>{const r=validateRecord(p.record),existing=first('records'),old=JSON.parse(existing?.record_json||JSON.stringify(blank()));r.bestFloor=Math.max(r.bestFloor,old.bestFloor);r.bestScore=Math.max(r.bestScore,old.bestScore);r.totalTime=Math.max(r.totalTime,old.totalTime);r.runs=Math.max(r.runs,old.runs);for(const [k,t]of Object.entries(old.milestones))r.milestones[k]=Math.min(r.milestones[k]??Infinity,t);h.set('records',{id:existing?.id||h.id(),record_json:JSON.stringify(r)});return{record:r};},
 operatorConfig:p=>{const existing=first('settings');let t=existing?get('towers',existing.tower_id):null;const wallets=h.wallets();if(p.save){const s=object(p.settings);bool(s.continueEnabled);bool(s.dailyChallenge);bool(s.leaderboardEnabled);integer(s.continuePrice,1,100000,'continue price');integer(s.checkpointFrequency,5,50,'checkpoint frequency');if(![.8,1,1.2].includes(s.difficulty))fail('Invalid difficulty.');if(s.continueEnabled&&!wallets.some(w=>w.id===s.walletId))fail('Choose your own receiving wallet.');const towerId=t?.id||h.id(),sourceId=h.id();h.set('invoice_sources',{id:sourceId,tower_id:towerId,wallet_id:s.continueEnabled?s.walletId:'',price:s.continuePrice,frequency:s.checkpointFrequency});t={id:towerId,source_id:sourceId,continue_enabled:s.continueEnabled,continue_price:s.continuePrice,checkpoint_frequency:s.checkpointFrequency,difficulty:s.difficulty,daily_challenge:s.dailyChallenge,leaderboard_enabled:s.leaderboardEnabled};h.set('towers',t);h.set('settings',{id:existing?.id||h.id(),tower_id:t.id});}const source=t?get('invoice_sources',t.source_id):null;return{tower:t?view(t):null,walletId:source?.wallet_id||'',wallets,defaults:DEFAULTS};},
 towerInfo:p=>({settings:view(tower(p.towerId)),day:day()}),
 beginRun:p=>{if(p.resume===true){const n=node(p),old=unpackReplay(n.state_json),t=tower(n.tower_id);if(!old.dead||old.checkpoint<1)fail('Reach a checkpoint and finish the run first.');const lives=old.lives??3;if(lives===0){const receipt=pub('receipts',id(p.paymentHash));if(!receipt||receipt.tower_id!==n.tower_id||receipt.checkpoint!==old.checkpoint||receipt.run_id!==n.id)fail('Pay for this checkpoint resume first.');}const key=lives===0?'paid_'+p.paymentHash:'free_'+n.id,existing=h.listPublic('run_nodes',n.tower_id,{resume_key:key},'id',false,1).rows[0],s=resumeRun(old),settings={...view(t),checkpointFrequency:s.frequency,difficulty:s.difficulty},next=existing||{...n,token:h.id(),day:n.day,started:h.now()-Math.floor(s.t),resume_key:key};return{runId:existing?.id||saveNode(next,s),token:next.token,seed:s.seed,day:next.day,settings,checkpoint:s.checkpoint,lives:s.lives,state:packState(s)};}const t=tower(p.towerId);if(typeof p.name!=='string'||!/^[\w .-]{1,20}$/.test(p.name)||!p.name.trim())fail('Use 1–20 letters, numbers, spaces, dots or dashes.');const today=day(),seed=t.daily_challenge?today:'circuit-'+h.id(),s=newRun(seed,view(t)),n={token:h.id(),root_id:h.id(),tower_id:t.id,day:today,started:h.now(),name:p.name.trim()};const runId=saveNode(n,s);return{runId,token:n.token,seed,day:today,settings:view(t),lives:s.lives};},
 verifyRun:p=>{
  const n=node(p),s=unpackReplay(n.state_json);
  if(n.day!==day())fail('This daily circuit has closed.');
  if(s.dead)fail('Run already ended.');
  if(!['checkpoint','death'].includes(p.event))fail('Reload the game before continuing.');
  const floor=integer(p.floor,0,10000,'floor'),elapsed=p.elapsed,highestTime=p.highestTime;
  if(!Number.isFinite(elapsed)||elapsed<s.elapsed||elapsed>1800||elapsed>h.now()-n.started+3)fail('Run timing is invalid.');
  if(!Number.isFinite(highestTime)||highestTime<s.highestTime||highestTime>elapsed)fail('Floor timing is invalid.');
  if(floor<s.highest)fail('Run progress cannot go backwards.');
  // Generous forward-speed bound includes conveyors and rotating platform carry.
  const minimum=Math.max(0,(floor-s.floor)*17-6)/12;
  if(floor>s.highest&&highestTime-s.elapsed<minimum)fail('Run progress is too fast.');
  if(floor===s.highest&&highestTime!==s.highestTime)fail('Highest-floor time cannot change.');
  if(p.event==='checkpoint'&&(floor<=s.checkpoint||floor%s.frequency!==0))fail('Invalid checkpoint order.');
  if(!Array.isArray(p.collected)||p.collected.length>512||new Set(p.collected).size!==p.collected.length)fail('Invalid pickups.');
  if(s.collected.some(id=>!p.collected.includes(id)))fail('Collected pickups cannot be removed.');
  let lives=s.lives;
  for(const pickup of p.collected){
   integer(pickup,16,40000,'pickup');
   if(s.collected.includes(pickup))continue;
   const pad=padFor(s.seed,pickup,s.frequency,s.difficulty);
   if(!pad.pickup||pad.floor>floor+1||pad.floor<s.floor-2||Math.max(0,(pad.floor-1-s.floor)*17-6)/12>elapsed-s.elapsed)fail('Pickup is not reachable.');
   if(pad.pickup==='life')lives++;
  }
  s.collected=[...p.collected];s.lives=Math.max(0,lives-(p.event==='death'?1:0));
  s.t=s.elapsed=elapsed;s.highest=floor;s.highestTime=highestTime;s.height=Math.max(s.height,floor*5);s.dead=p.event==='death';
  if(!s.dead){s.floor=s.checkpoint=floor;s.milestones[floor]=elapsed;}
  const key='report_'+n.id+'_'+p.event+'_'+floor;
  const existing=h.listPublic('run_nodes',n.tower_id,{resume_key:key},'id',false,1).rows[0];
  if(existing&&existing.state_json!==packReplay(s))fail('This report was already submitted with different data.');
  return{runId:existing?.id||saveNode({...n,resume_key:key},s),dead:s.dead,floor:s.highest,checkpoint:s.checkpoint,lives:s.lives,highestTime:s.highestTime};
 },
 finishRun:p=>{const n=node(p),s=unpackReplay(n.state_json),t=tower(n.tower_id);if(n.day!==day())fail('This daily circuit has closed.');if(!s.dead)fail('Finish the run before submitting.');if(h.now()-n.started>s.t+12)fail('Run paused too long for daily ranking.');if(s.frequency!==t.checkpoint_frequency||s.difficulty!==t.difficulty)fail('Circuit settings changed during this run.');if(!t.leaderboard_enabled||!t.daily_challenge)fail('Daily leaderboard is disabled.');const data={root_id:n.root_id,name:n.name,day:n.day,rules:s.frequency+'/'+s.difficulty,floor:s.highest,time_ms:Math.round(s.highestTime*1000),score:score(s),rank_key:s.highest*100000000-Math.round(s.highestTime*1000)};if(!h.listPublic('scores',n.tower_id,{root_id:n.root_id,rank_key:data.rank_key},'id',false,1).rows.length)h.append('scores',n.tower_id,data);return{accepted:true,floor:s.highest,timeMs:data.time_ms};},
 leaderboard:p=>{const t=tower(p.towerId),d=p.day||day();if(!/^\d{4}-\d{2}-\d{2}$/.test(d))fail('Invalid day.');if(!t.leaderboard_enabled)return{rows:[],day:d};const page=h.listPublic('scores',t.id,{day:d},'rank_key',true,100);const seen=new Set(),rows=[];for(const r of page.rows){if(seen.has(r.root_id))continue;seen.add(r.root_id);rows.push({name:r.name,floor:r.floor,timeMs:r.time_ms,score:r.score});if(rows.length===20)break;}return{rows,day:d,closed:d<day(),limit:20};},
 continueInvoice:p=>{const n=node(p),s=unpackReplay(n.state_json),t=tower(n.tower_id);if(!s.dead||s.checkpoint<1)fail('Reach a checkpoint and finish the run first.');if((s.lives??3)>0)fail('Use your free checkpoint lives first.');if(!t.continue_enabled)fail('Continues are disabled.');const source=pub('invoice_sources',t.source_id);if(!source)fail('Invoice configuration is unavailable.');const inv=h.invoice({sourceId:source.id,amount:source.price,currency:'sat',memo:'Sat Run · resume from floor '+s.checkpoint,extra:[['checkpoint',String(s.checkpoint)],['price',String(source.price)],['run_id',n.id]]});return{paymentHash:inv.paymentHash,paymentRequest:inv.paymentRequest,checkpoint:s.checkpoint,amount:source.price,towerId:t.id};},
 continueStatus:p=>{const receipt=pub('receipts',id(p.paymentHash));return{paid:!!receipt,checkpoint:receipt?.checkpoint||0,towerId:receipt?.tower_id||''};},
 invoicePaid:p=>{if(p.extension!=='satrun'||p.pending!==false||String(p.status).toLowerCase()!=='success'||p.extra?.tag!=='satrun')fail('Not a settled Sat Run invoice.');const hash=id(p.paymentHash),sourceId=id(p.extra.source_id),extra=object(p.extra.extra_satrun),floor=integer(Number(extra.checkpoint),1,100000,'checkpoint'),price=integer(Number(extra.price),1,100000,'price');const source=get('invoice_sources',sourceId);if(!source||source.wallet_id!==p.walletId||source.price!==price||p.amount!==price*1000)fail('Payment does not match its source.');if(get('receipts',hash))return{accepted:true};const runId=id(extra.run_id),n=get('run_nodes',runId);if(!n||n.tower_id!==source.tower_id)fail('Payment run does not match its source.');const state=unpackReplay(n.state_json);if(!state.dead||state.checkpoint!==floor||(state.lives??3)!==0)fail('Payment checkpoint is invalid.');h.set('receipts',{id:hash,tower_id:source.tower_id,checkpoint:floor,run_id:runId});return{accepted:true};}
 };return(name,raw)=>{try{const p=object(JSON.parse(raw));if(!ops[name])fail('Unknown action.');return JSON.stringify({ok:true,data:ops[name](p)});}catch(e){return JSON.stringify({ok:false,error:e instanceof SyntaxError?'Invalid JSON.':e instanceof InputError?e.message:'Could not complete this action.'});}};
}
