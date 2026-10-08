import assert from 'node:assert/strict';
import {newRun,step,unpackState,ensurePads,padFor,pose,discPoses,slabAngle,resumeRun,die,botInput,encodeInput,decodeInput,packState,DT,JUMP,GRAVITY,SPEED,MODULES} from './physics.js';
import {createService,DEFAULTS} from './service.js';
assert(padFor('curve',1).w>padFor('curve',81).w,'Opening landings are wider');
assert(padFor('curve',21).rate<padFor('curve',141).rate,'Hazards accelerate with progression');
let traversed=0;for(let seed=0;seed<30;seed++){const s=newRun('seed'+seed);while(s.elapsed<80&&!s.dead&&s.highest<7)step(s,botInput(s,s.pads.get(s.lastPad+1)));assert(s.highest>=7,'Opening reachable: '+seed+' '+s.reason);traversed++;}
const belt=newRun('daily');let beltId=1;while(padFor('daily',beltId).type!=='conveyor')beltId++;const beltPad=padFor('daily',beltId);Object.assign(belt.p,{x:beltPad.x,y:beltPad.y,z:beltPad.z,ground:beltId});ensurePads(belt);const beltX=belt.p.x,beltZ=belt.p.z;for(let i=0;i<30;i++)step(belt,{});assert(Math.abs(belt.p.x-beltX)<1e-9,'Conveyor has no sideways force');assert(belt.p.z<beltZ-.35,'Conveyor pushes along forward arrows');
const jump=newRun();step(jump,{jump:true});assert(jump.p.vy>0);assert.equal(jump.events[0],'jump');const buffer=newRun();buffer.p.y=.12;buffer.p.vy=-1;buffer.p.ground=null;buffer.p.coyote=0;step(buffer,{jump:true});for(let i=0;i<18;i++)step(buffer,{});assert(buffer.p.vy>0,'Buffered jump fires on landing');
const arc=newRun();step(arc,{jump:true});let peak=0;while(arc.p.ground===null&&arc.t<2){peak=Math.max(peak,arc.p.y);step(arc,{});}assert(peak>1.9&&peak<2.2,'Controlled jump height');assert(arc.t<.82,'Shorter jump airtime');const brake=newRun();step(brake,{jump:true,z:-1});for(let i=0;i<35;i++)step(brake,{z:-1});for(let i=0;i<40;i++)step(brake,{});assert(Math.abs(brake.p.vz)<.6,'Releasing input brakes air drift');
const coyote=newRun();coyote.p.x=3.3;coyote.p.ground=null;coyote.p.coyote=.08;step(coyote,{jump:true});assert(coyote.p.vy>0);
const death=newRun();death.p.y=-14;step(death);assert(death.dead);const deadTime=death.t;step(death);assert.equal(death.t,deadTime);const resume=newRun('daily',{},10);assert.equal(resume.p.y,50);assert.equal(resume.lava,37);assert.equal(resume.continued,true);
const replay=newRun('identical');for(let i=0;i<300;i++)step(replay,decodeInput(i<100?4:0));assert.equal(packState(unpackState(packState(replay))),packState(replay));
// In-memory host exercises exports and payment invariants, not just isolated helpers.
let now=1791374400,serial=0;const data=new Map(),h={now:()=>now,id:()=>`reference_${++serial}`,first:t=>[...data.entries()].find(([k])=>k.startsWith(t+':'))?.[1]||null,get:(t,id)=>data.get(t+':'+id)||null,publicGet:(t,id)=>{const row=data.get(t+':'+id);if(!row)return null;const {signing_key,...visible}=row;return visible;},set:(t,row)=>data.set(t+':'+row.id,structuredClone(row)),wallets:()=>[{id:'wallet_owner',name:'Owner'}],append:(t,sourceId,row)=>{assert(!('tower_id'in row),'Host injects source scope');const id=`row_${++serial}_long`;data.set(t+':'+id,{...structuredClone(row),id,tower_id:sourceId});return id;},listPublic:(table,sourceId,filters)=>({rows:[...data.entries()].filter(([key,row])=>key.startsWith(table+':')&&row.tower_id===sourceId&&Object.entries(filters).every(([k,v])=>row[k]===v)).map(([,row])=>row)}),invoice:p=>{assert.equal(p.amount,21);assert(!('walletId'in p));return{paymentHash:'hash_12345678',paymentRequest:'lnbc_test'};}};
const service=createService(h),call=(name,p={})=>{const r=JSON.parse(service(name,JSON.stringify(p)));assert(r.ok,r.error);return r.data;};
const settings={...DEFAULTS,continueEnabled:true,walletId:'wallet_owner'};const operator=call('operatorConfig',{save:true,settings});const towerId=operator.tower.id;assert(!('wallet_id'in call('towerInfo',{towerId}).settings));assert.equal(JSON.parse(service('operatorConfig',JSON.stringify({save:true,settings:{...settings,walletId:'foreign'}}))).ok,false);
const {packReplay,unpackReplay}=await import('./replay-proof.js');
const reject=(name,p)=>assert.equal(JSON.parse(service(name,JSON.stringify(p))).ok,false);
const report=s=>({event:s.dead?'death':'checkpoint',floor:s.highest,elapsed:s.elapsed,highestTime:s.highestTime,collected:[...s.collected]});
let handle=call('beginRun',{towerId,name:'runner'});
reject('verifyRun',{...handle,token:'forged',event:'death',floor:0,elapsed:0,highestTime:0,collected:[]});
reject('verifyRun',{...handle,frames:[0]});
reject('verifyRun',{...handle,event:'checkpoint',floor:10,elapsed:1,highestTime:1,collected:[]});
now+=40;
const checkpoint={...handle,event:'checkpoint',floor:10,elapsed:40,highestTime:40,collected:[]};
for(const patch of [{floor:9},{floor:10000},{elapsed:400},{elapsed:-1},{highestTime:41},{collected:[16,16]},{collected:[17]},{collected:[400]},{collected:null}])reject('verifyRun',{...checkpoint,...patch});
const checked=call('verifyRun',checkpoint),rows=data.size;assert.equal(call('verifyRun',checkpoint).runId,checked.runId,'Retry after lost response reuses snapshot');assert.equal(data.size,rows);reject('verifyRun',{...checkpoint,elapsed:39,highestTime:39});Object.assign(handle,checked);
assert(!('proof' in checked));reject('verifyRun',{...handle,event:'checkpoint',floor:0,elapsed:41,highestTime:40,collected:[]});reject('finishRun',handle);
// Real client physics produces just a checkpoint report and a death report.
let lifeHandle=call('beginRun',{towerId,name:'lives_test'}),lifeState=newRun(lifeHandle.seed,lifeHandle.settings),reports=0;
const snapshotsBefore=[...data.keys()].filter(k=>k.startsWith('run_nodes:')).length;
function reportDeath(climb){let previous=lifeState.elapsed;while(!lifeState.dead&&lifeState.t<100){const input=climb&&lifeState.highest<10?botInput(lifeState,lifeState.pads.get(lifeState.lastPad+1)):{x:1};step(lifeState,decodeInput(encodeInput(input)));if(lifeState.events.includes('checkpoint')||lifeState.dead){now+=lifeState.elapsed-previous;previous=lifeState.elapsed;Object.assign(lifeHandle,call('verifyRun',{...lifeHandle,...report(lifeState),lives:999}));reports++;}}}
assert.equal(lifeHandle.lives,1);reportDeath(true);assert.equal(lifeState.checkpoint,10);assert.equal(lifeState.lives,0);assert.equal(lifeHandle.lives,0,'Client lives are ignored');call('finishRun',lifeHandle);
assert.equal(reports,2);assert.equal([...data.keys()].filter(k=>k.startsWith('run_nodes:')).length-snapshotsBefore,2);
reject('verifyRun',{...lifeHandle,...report(lifeState)});
assert.equal(call('continueInvoice',lifeHandle).checkpoint,10);reject('beginRun',{...lifeHandle,resume:true,lives:999});
// A paid receipt is accepted once, only by the event export, after amount/source checks.
const source=[...data.entries()].find(([k])=>k.startsWith('invoice_sources:'))[1];const evt={extension:'satrun',pending:false,status:'success',paymentHash:'hash_12345678',walletId:'wallet_owner',amount:21000,extra:{tag:'satrun',source_id:source.id,extra_satrun:{checkpoint:'10',price:'21',run_id:lifeHandle.runId}}};assert.equal(JSON.parse(service('invoicePaid',JSON.stringify({...evt,amount:20000}))).ok,false);assert.equal(call('continueStatus',{paymentHash:evt.paymentHash}).paid,false);call('invoicePaid',evt);call('invoicePaid',evt);assert.equal(call('continueStatus',{paymentHash:evt.paymentHash}).checkpoint,10);lifeHandle=call('beginRun',{...lifeHandle,resume:true,paymentHash:evt.paymentHash});assert.equal(lifeHandle.lives,1,'One payment restores one total life');lifeState=unpackState(lifeHandle.state);reportDeath(false);assert.equal(JSON.parse(service('finishRun',JSON.stringify(lifeHandle))).ok,true,'Server ranks paid extra resumes with cumulative time');assert.equal([...data.keys()].filter(k=>k.startsWith('receipts:')).length,1);
console.log('PASS',traversed,'opening climbs, physics/milestones, server-authorized one-life payment flow.');
// New obstacles: collision geometry, seeded hazards, one-life economy and durable pickups.
const singleLife=newRun('seed2');assert.equal(singleLife.lives,1);die(singleLife,'test');die(singleLife,'again');assert.equal(singleLife.lives,0);assert.equal(resumeRun(singleLife).lives,1);
for(const type of ['frontdiscs','sidediscs','parkour','rotor']){
 let id=1;while(id<100&&padFor('seed2',id).type!==type)id++;assert(id<100,type+' appears in the opening');
 const pad=padFor('seed2',id);assert.deepEqual(pad,padFor('seed2',id));
 if(pad.discs){const d=discPoses(pad,1).find(d=>d.visible);assert(d);assert.deepEqual(discPoses(pad,1),discPoses(pad,1));const hit=newRun('seed2',{},pad.floor-1);Object.assign(hit.p,{x:d.x,y:d.y-.3,z:d.z,ground:null,coyote:0});hit.t=1-DT;step(hit);assert.equal(hit.reason,'DISC INTERCEPTED YOU',type+' hits capsule');const clear=newRun('seed2',{},pad.floor-1);Object.assign(clear.p,{x:d.x,y:d.y+.2,z:d.z,ground:null,coyote:0});clear.t=1-DT;step(clear);assert(!clear.dead,type+' can be jumped');}
 if(type==='rotor'){
  const s=newRun('seed2',{},pad.floor-1);s.t=(Math.PI/2-pad.phase+Math.PI*2)/pad.rate;Object.assign(s.p,{x:pad.x,y:pad.y+.001,z:pad.z+1.5,vy:-1,ground:null,coyote:0});step(s);assert.equal(s.p.ground,pad.id,'Rotated long axis supports landing');
  const x=s.p.x,z=s.p.z;step(s);assert(Math.hypot(s.p.x-x,s.p.z-z)>.001,'Slab carries the standing runner');
  const miss=newRun('seed2',{},pad.floor-1);miss.t=s.t;Object.assign(miss.p,{x:pad.x+1.5,y:pad.y+.001,z:pad.z,vy:-1,ground:null,coyote:0});step(miss);assert.notEqual(miss.p.ground,pad.id,'Rotated short axis has no invisible floor');assert(slabAngle(pad,s.t)>0);
 }
}
const gateA=padFor('seed2',57),gateB=padFor('seed2',58);assert.notEqual(gateA.phase,gateB.phase,'Later gates are staggered');assert.notEqual(gateA.rate,gateB.rate);
for(const kind of ['life','flight']){
 let seed=0,pad;do{pad=padFor('reward'+seed++,32);}while(pad.pickup!==kind);
 const s=newRun('reward'+(seed-1),{},8);Object.assign(s.p,{x:pad.x+pad.pickupX,y:pad.y,z:pad.z,ground:32});step(s);assert(s.collected.includes(32));assert(s.events.includes(kind==='life'?'extra-life':'flight'));
 if(kind==='life'){assert.equal(s.lives,2);step(s);assert.equal(s.lives,2,'Pickup cannot repeat');die(s,'test');assert.equal(s.lives,1);}
 else{assert(Math.abs(s.flyUntil-s.t-5)<1e-9);const y=s.p.y;for(let i=0;i<120;i++)step(s);assert(s.p.y>y+2,'Flight lifts the runner');s.t=s.flyUntil;step(s);assert(s.p.vy<2.2,'Flight expires after five simulation seconds');}
 s.checkpoint=8;const resumed=resumeRun(s);assert(resumed.collected.includes(32),'Checkpoint keeps pickup history');assert.equal(resumed.flyUntil,0,'Death ends flight');Object.assign(resumed.p,{x:pad.x+pad.pickupX,y:pad.y,z:pad.z,ground:32});const lives=resumed.lives;step(resumed);assert.equal(resumed.lives,lives);assert.equal(resumed.flyUntil,0,'No farming pickups after resume');
 const copy=unpackState(packState(resumed));assert.equal(packState(copy),packState(resumed));
}
// All new static jumps fit the same jump envelope, even at late-floor narrowing.
for(let seed=0;seed<100;seed++)for(let id=1;id<=400;id++){
 const a=padFor('bounds'+seed,id-1),b=padFor('bounds'+seed,id),launch=a.type==='bounce'?13:JUMP,rise=b.y-a.y+(b.type==='lift'?.44:0),air=(launch+Math.sqrt(launch*launch-2*GRAVITY*rise))/GRAVITY;
 assert(Number.isFinite(air),'Reachable height');const span=p=>p.type==='rotor'?Math.min(p.w,p.d):p.d,gapZ=Math.max(0,Math.abs(b.z-a.z)-(span(a)+span(b))/2+.2),gapX=Math.max(0,Math.abs(b.x-a.x)-(a.w+b.w)/2+.2);assert(Math.hypot(gapX,gapZ)<air*SPEED,'Reachable precision/rotating jump');
}
// Old stored score metadata must never hide a verified daily score.
h.append('scores',towerId,{root_id:'old_run',name:'previous_best',day:call('gameInfo').day,rules:'10/1/v2',floor:29,time_ms:124258,score:30207,rank_key:2900000000-124258});
assert(call('leaderboard',{towerId}).rows.some(r=>r.name==='previous_best'&&r.floor===29));
const {readFileSync}=await import('node:fs'),{runInNewContext}=await import('node:vm');let admin;
assert.equal(call('gameInfo').version,JSON.parse(readFileSync(new URL('../config.json',import.meta.url),'utf8')).version,'Release and game-info versions agree');
runInNewContext(readFileSync(new URL('../static/admin.js',import.meta.url),'utf8'),{Vue:{h:()=>{},createApp:config=>{admin=config;return{use:()=>({mount(){}})}}},Quasar:{}});
const owner={...admin.data(),tower:{id:towerId},api:async(path,body)=>{assert.equal(path,'/leaderboard');assert.deepEqual(Object.keys(body),['towerId']);return call('leaderboard',body);}};
await admin.methods.refresh.call(owner);assert(owner.rows.some(r=>r.floor===29));
console.log('PASS 40,000 jump envelopes and one daily leaderboard across existing scores.');
// A stored, server-earned extra life permits a free resume and blocks invoicing.
const extraNode=data.get('run_nodes:'+lifeHandle.runId),extraState=unpackReplay(extraNode.state_json);extraState.lives=1;extraNode.state_json=packReplay(extraState);
assert.equal(JSON.parse(service('continueInvoice',JSON.stringify(lifeHandle))).ok,false);const freeRequest={...lifeHandle,resume:true},freeResume=call('beginRun',freeRequest);assert.equal(freeResume.lives,1);assert.equal(call('beginRun',freeRequest).runId,freeResume.runId);assert.equal(unpackState(freeResume.state).elapsed,extraState.elapsed);

for(const state of [newRun('compact'),lifeState]){const packed=packReplay(state);assert(packed.length<packState(state).length/3);const restored=unpackReplay(packed);assert.equal(packReplay(restored),packed,'Effective trigger times survive compact proof');const original=unpackState(packState(state));for(let i=0;i<30;i++){step(original,{x:.3,z:-.7});step(restored,{x:.3,z:-.7});}assert.equal(packReplay(restored),packReplay(original),'Compact state preserves subsequent physics');}
const baseState=newRun('history');baseState.collected=Array.from({length:200},(_,i)=>i*16);baseState.milestones={'10':25,'20':55};
const nextState=unpackReplay(packReplay(baseState));nextState.collected.push(4000);nextState.milestones['30']=85;
const delta=packReplay(nextState,baseState),merged=unpackReplay(delta,baseState);
assert.deepEqual(merged.collected,nextState.collected);assert.deepEqual(merged.milestones,nextState.milestones);assert.equal(merged.seed,baseState.seed);
assert(delta.length<400,'Proofs carry new pickups/milestones, not accumulated history');
console.log('PASS compact snapshots and checkpoint/death checks without input replay.');

// Seeded pickup claims control lives; duplicate/removal/unreachable claims are rejected.
let rewardSeed='reward0';while(padFor(rewardSeed,16).pickup!=='life')rewardSeed+='x';
const pickupHandle=call('beginRun',{towerId,name:'pickups'}),pickupRow=data.get('run_nodes:'+pickupHandle.runId);pickupRow.state_json=packReplay(newRun(rewardSeed,DEFAULTS));now+=40;
const pickupReport={...pickupHandle,event:'checkpoint',floor:10,elapsed:40,highestTime:40,collected:[16]},pickupCheck=call('verifyRun',pickupReport);assert.equal(pickupCheck.lives,2);
reject('verifyRun',{...pickupCheck,token:pickupHandle.token,event:'death',floor:10,elapsed:41,highestTime:40,collected:[]});
const pickupDeath=call('verifyRun',{...pickupCheck,token:pickupHandle.token,event:'death',floor:10,elapsed:41,highestTime:40,collected:[16],lives:1000});assert.equal(pickupDeath.lives,1);
reject('continueInvoice',{...pickupDeath,token:pickupHandle.token});const pickupResume=call('beginRun',{...pickupDeath,token:pickupHandle.token,resume:true});assert.equal(pickupResume.lives,1);assert.deepEqual(unpackState(pickupResume.state).collected,[16]);
console.log('PASS seeded pickup accounting, no duplicate/future claims and server-controlled free resumes.');
