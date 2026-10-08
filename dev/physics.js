// Feet-based capsule approximation. Fixed 120 Hz; rendering never changes physics.
export const DT=1/120, GRAVITY=28, JUMP=10.9, SPEED=6.4, RADIUS=.29, BODY=1.35;
export const MODULES=['steps','balance','conveyor','drift','lift','pulse','crumble','ice','bounce','sweeper','gates','split','frontdiscs','sidediscs','parkour','rotor'];
export const LABELS={steps:'CIRCUIT STEPS',balance:'BALANCE BRIDGE',conveyor:'AGAINST THE CURRENT',drift:'MOVING CROSSING',lift:'UPLINK',pulse:'PHASE SHIFT',crumble:'LOST PACKETS',ice:'COLD STORAGE',bounce:'LAUNCH + LAND',sweeper:'ROTATING ARENA',gates:'TIMED GATES',split:'CHOOSE YOUR ROUTE'};
export function hash(str){let n=2166136261;for(const c of String(str))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
Object.assign(LABELS,{frontdiscs:'INCOMING DISCS',sidediscs:'CROSSFIRE',parkour:'PRECISION PARKOUR',rotor:'ROTATING SLABS'});
export function moduleFor(seed,floor){
 const lesson=['steps','steps','balance','drift','sweeper','gates','split','bounce','frontdiscs','crumble','parkour','sidediscs','rotor','pulse','gates'];
 return floor<=15?(lesson[Math.max(0,floor-1)]||'steps'):MODULES[Math.floor(random(hash(seed+':'+floor))()*MODULES.length)];
}
export function padFor(seed,index,frequency=10,difficulty=1){
 const floor=Math.floor((index-1)/4)+1,step=(index-1)%4+1,r=random(hash(seed+':pad:'+index)),module=moduleFor(seed,floor);
 const dock=index===0||step===4,checkpoint=index>0&&dock&&floor%frequency===0;
 const p={id:index,floor:index?floor:0,type:dock?'steps':module,module,checkpoint,x:index===0?0:Math.sin(index*.45)*Math.min(1.7,.4+floor*.035)+(r()-.5)*.2,z:-index*4.25,y:index*1.25,w:dock?6:4.1,d:dock?4.6:3.3,phase:r()*Math.PI*2,rate:Math.min(1.6,.65+floor*.009)*difficulty,trigger:null,active:true};
 if(module==='split'&&dock&&index)p.w=12;
 // Wide opening landings narrow as hazards accelerate.
 const pressure=Math.min(1,Math.max(0,(floor-3)/30));
 {p.rate=(.52+pressure*.85)*difficulty;if(!dock){p.w=4.8-pressure*.9;p.d=3.8-pressure*.6;}}
 {
  // Sparse, seeded pickups; collected IDs survive checkpoint resumes.
  if(index>0&&step===4&&floor%4===0){const reward=random(hash(seed+':reward:'+floor));p.pickup=reward()<.4?'life':'flight';p.pickupX=(reward()<.5?-1:1)*1.7;}
 }
 if(dock)return p;
 if(module==='balance'){p.w=2.1-pressure*.55;p.d=4.6;p.ramp=true;}
 if(module==='gates'){p.w=5.5;p.d=4.6;p.ramp=true;p.phase=random(hash(seed+':gate:'+floor))()*Math.PI*2;p.rate=(.8+pressure*.6)*difficulty;}
 if(module==='gates'&&floor>6){p.phase+=step*(floor%2?1.8:-1.4);p.rate*=1+step*.08;}
 if(module==='pulse')p.phase=random(hash(seed+':pulse:'+floor))()*Math.PI*2;
 if(module==='drift'){if(step===1)p.type='steps';else{p.w=3.9-pressure*.5;p.d=3.5-pressure*.4;p.phase=random(hash(seed+':crossing:'+floor))()*Math.PI*2;}}
 if(module==='sweeper'){if(step===2){p.w=p.d=8.5;p.shape='circle';}else p.type='steps';}
 if(module==='split'){p.w=12;p.d=3.8;p.lanes=[{x:step===2?-4.2:-3.2,w:3.6,d:3.8},{x:2.5,w:1.4,d:2.9}];}
 if(module==='bounce'){p.type=step===2?'bounce':'steps';if(step===2){p.shape='circle';p.w=p.d=3.8;}if(step===3){p.y+=1;p.target=true;p.w=p.d=4.4;}}
 {
  if(module==='parkour'){p.x+=(step%2?1:-1)*(1.15+pressure*.4);p.w=2.5-pressure*.5;p.d=2.7-pressure*.3;}
  if(module==='rotor'){p.w=4.6;p.d=1.6;p.rate=(.65+pressure*.6)*difficulty;}
  if(module==='frontdiscs'||module==='sidediscs'){p.w=5.5;p.d=4;p.discs=module==='frontdiscs'?'front':'side';}
  else if(floor>=16&&!['parkour','rotor','bounce'].includes(module)&&random(hash(seed+':volley:'+floor))()<.22)p.discs=floor%2?'front':'side';
 }
 return p;
}
export function pose(p,t){let x=p.x,y=p.y,z=p.z;
 if(p.type==='drift')x+=Math.sin(t*p.rate+p.phase)*2.1;
 if(p.type==='lift')y+=Math.sin(t*p.rate+p.phase)*.22;
 return{x,y,z};
}
export function surfaces(p,t){const q=pose(p,t);return p.lanes?p.lanes.map(l=>({...q,x:q.x+l.x,w:l.w,d:l.d})): [{...q,w:p.w,d:p.d}];}
export function slabAngle(p,t){return p.type==='rotor'?t*p.rate+p.phase:0;}
export function discPoses(p,t){
 if(!p.discs)return[];const q=pose(p,t),pressure=Math.min(1,p.floor/40),period=3.7-pressure,speed=(4.8+pressure*2)*p.rate/.9;
 return Array.from({length:p.floor>=20?2:1},(_,i)=>{const cycle=t/period+p.phase/(Math.PI*2)+i*.5,shot=Math.floor(cycle),travel=(cycle-shot)*period*speed-6,side=(shot+i)%2?1:-1;
  return p.discs==='front'?{x:q.x+Math.sin(shot*2.4+p.phase)*1.8,y:q.y+.68,z:q.z+travel,visible:travel<6}:{x:q.x+travel*side,y:q.y+.68,z:q.z+Math.sin(shot+p.phase)*.9,visible:travel<6};});
}
export function surfaceY(p,q,z){return q.y-(p.ramp?Math.max(-p.d/2,Math.min(p.d/2,z-q.z))*1.25/4.25:0);}
export function gateOpen(p,t){return Math.sin(t*p.rate+p.phase)>-.3;}
export function active(p,t){return !(p.type==='pulse'&&(t*p.rate+p.phase)%(Math.PI*2)>4.7)&&!(p.type==='crumble'&&p.trigger!==null&&t-p.trigger>1.1);}
export function newRun(seed='daily',settings={},startFloor=0){
 const frequency=settings.checkpointFrequency||10,difficulty=settings.difficulty||1,p=padFor(seed,startFloor*4,frequency,difficulty);
 const s={seed,frequency,difficulty,t:0,elapsed:0,p:{x:p.x,y:p.y,z:p.z,vx:0,vy:0,vz:0,ground:p.id,coyote:.105,buffer:0},pads:new Map(),floor:startFloor,highest:startFloor,height:p.y,highestTime:0,checkpoint:startFloor,lava:p.y-13,dead:false,events:[],milestones:{},center:null,lastPad:startFloor*4,land:.0,continued:startFloor>0,lives:1,paid:false,collected:[],flyUntil:0};
 ensurePads(s);return s;
}
export function resumeRun(old){
 const s=newRun(old.seed,{checkpointFrequency:old.frequency,difficulty:old.difficulty},old.checkpoint);
 s.lives=Math.max(1,old.lives);s.paid=!!old.paid||(old.lives??3)===0;
 s.collected=[...(old.collected||[])];
 s.t=old.t;s.elapsed=old.elapsed;s.highest=old.highest;s.highestTime=old.highestTime;s.milestones={...old.milestones};
 return s;
}
export function ensurePads(s){const center=Math.max(0,Math.floor(-s.p.z/4.25));if(s.center===center)return;s.center=center;for(let i=Math.max(0,center-8);i<=center+32;i++)if(!s.pads.has(i))s.pads.set(i,padFor(s.seed,i,s.frequency,s.difficulty));for(const [id]of s.pads)if(id<center-9||id>center+36)s.pads.delete(id);}
export function encodeInput(i){const zig=v=>{const q=Math.round(Math.max(-1,Math.min(1,v||0))*20);return q<0?-2*q-1:2*q;};return zig(i.x)+zig(i.z)*64+(i.jump?4096:0);}
export function decodeInput(m){const unzig=v=>(v%2?-1:1)*Math.ceil(v/2)/20;return{x:unzig(m&63),z:unzig((m>>6)&63),jump:!!(m&4096)};}
export function packState(s){return JSON.stringify({...s,pads:[...s.pads],events:[]});}
export function unpackState(json){const s=JSON.parse(json);s.pads=new Map(s.pads);s.collected??=[];s.flyUntil??=0;return s;}
const approach=(a,b,d)=>a<b?Math.min(b,a+d):Math.max(b,a-d);
export function step(s,input={},dt=DT){
 if(s.dead)return;s.events=[];s.t+=dt;s.elapsed+=dt;s.land=Math.max(0,s.land-dt*4);const p=s.p;
 s.lava+=dt*(s.elapsed<12?.18:Math.min(.67,.3+s.elapsed*.0012))*s.difficulty;
 ensurePads(s);
 const grounded=s.pads.get(p.ground);
 if(grounded&&active(grounded,s.t)&&grounded.y>s.lava){const a=pose(grounded,s.t-dt),b=pose(grounded,s.t);if(grounded.type==='rotor'){const angle=slabAngle(grounded,s.t)-slabAngle(grounded,s.t-dt),x=p.x-a.x,z=p.z-a.z;p.x=a.x+x*Math.cos(angle)-z*Math.sin(angle);p.z=a.z+x*Math.sin(angle)+z*Math.cos(angle);}p.x+=b.x-a.x;p.y+=b.y-a.y;p.z+=b.z-a.z;}
 else p.ground=null;
 p.coyote=p.ground!==null?.105:Math.max(0,p.coyote-dt);p.buffer=input.jump?.12:Math.max(0,p.buffer-dt);
 let ix=input.x||0,iz=input.z||0;const len=Math.hypot(ix,iz);if(len>1){ix/=len;iz/=len;}
 const accel=p.ground!==null?(grounded?.type==='ice'?9:55):36,friction=p.ground!==null?(grounded?.type==='ice'?3:65):18;
 p.vx=approach(p.vx,ix*SPEED,(ix?accel:friction)*dt);p.vz=approach(p.vz,iz*SPEED,(iz?accel:friction)*dt);
 if(p.buffer>0&&p.coyote>0){p.vy=JUMP;p.buffer=0;p.coyote=0;p.ground=null;s.events.push('jump');}
 const oldY=p.y,oldX=p.x,oldZ=p.z;
 if(s.flyUntil>s.t){p.vy=2.2;p.ground=null;p.coyote=0;}else p.vy-=GRAVITY*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;
 if(p.ground!==null&&grounded?.type==='conveyor'){p.z-=1.6*dt;}
 p.ground=null;
 // Pads never move along Z; only overlapping rows can collide with the runner.
 const first=Math.max(0,Math.ceil((-p.z-4.6-RADIUS)/4.25)),last=Math.floor((-p.z+4.6+RADIUS)/4.25);
 for(let id=first;id<=last;id++){
  const pad=s.pads.get(id);if(!pad)continue;
  if(Math.abs(p.z-pad.z)>(pad.type==='rotor'?Math.max(pad.w,pad.d):pad.d)/2+RADIUS)continue;
  pad.active=active(pad,s.t)&&pad.y>s.lava; if(!pad.active)continue;const previous=pose(pad,s.t-dt);
  for(const q of surfaces(pad,s.t)){const top=surfaceY(pad,q,p.z),oldTop=surfaceY(pad,{...q,y:previous.y},oldZ);
  const angle=slabAngle(pad,s.t),dx=p.x-q.x,dz=p.z-q.z,localX=angle?dx*Math.cos(angle)+dz*Math.sin(angle):dx,localZ=angle?-dx*Math.sin(angle)+dz*Math.cos(angle):dz;
  const over=pad.shape==='circle'?Math.hypot(dx/(q.w/2+RADIUS*.65),dz/(q.d/2+RADIUS*.65))<1:Math.abs(localX)<q.w/2+RADIUS*.65&&Math.abs(localZ)<q.d/2+RADIUS*.65;
  if(over&&p.vy<=0&&oldY>=oldTop-.065&&p.y<=top){
   const impact=-p.vy;s.lastPad=pad.id;p.y=top;p.vy=0;p.ground=pad.id;p.coyote=.105;
   if(impact>2){s.land=Math.min(1,impact/13);s.events.push('land');}
   if(pad.trigger===null)pad.trigger=s.t;
   const f=pad.id%4===0?pad.floor:Math.max(0,pad.floor-1);s.floor=f;
   if(f>s.highest){s.highest=f;s.highestTime=s.elapsed;s.events.push('floor');if(f%s.frequency===0){s.checkpoint=f;s.milestones[f]=s.elapsed;s.events.push('checkpoint');}}
   if(pad.type==='bounce'){p.vy=13;p.ground=null;p.coyote=0;s.events.push('bounce');}
  }else if(over&&p.vy>0&&oldY+BODY<=oldTop-.3&&p.y+BODY>=top-.3){p.y=top-.3-BODY;p.vy=0;}
  else if(!pad.ramp&&pad.type!=='rotor'&&p.y<top-.07&&p.y+BODY>top-.3){
   if(Math.abs(oldX-q.x)>=q.w/2+RADIUS&&Math.abs(p.z-q.z)<q.d/2+RADIUS){p.x=oldX;p.vx=0;}
   if(Math.abs(oldZ-q.z)>=q.d/2+RADIUS&&Math.abs(p.x-q.x)<q.w/2+RADIUS){p.z=oldZ;p.vz=0;}
  }
  if(pad.type==='sweeper'&&pad.trigger!==null&&s.t-pad.trigger>.4&&p.y<q.y+.63&&p.y+BODY>q.y+.35){const a=s.t*pad.rate+pad.phase,dx=p.x-q.x,dz=p.z-q.z,along=dx*Math.cos(a)+dz*Math.sin(a),across=-dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(along)<pad.w*.4&&Math.abs(across)<.15+RADIUS){die(s,'SWEEP CAUGHT YOU');return;}}
  if(pad.type==='gates'&&!gateOpen(pad,s.t)&&Math.abs(p.z-q.z)<.18+RADIUS&&Math.abs(p.x-q.x)<pad.w/2&&p.y<top+3&&p.y+BODY>top){die(s,'GATE CLOSED');return;}
  }
 }
 for(let id=Math.max(0,Math.ceil((-p.z-7)/4.25));id<=Math.floor((-p.z+7)/4.25);id++){
  const pad=s.pads.get(id);if(!pad||(!pad.discs&&!pad.pickup))continue;
  if(pad.y<=s.lava||Math.abs(p.z-pad.z)>7||!active(pad,s.t))continue;
  for(const disc of discPoses(pad,s.t))if(disc.visible&&Math.hypot(p.x-disc.x,p.z-disc.z)<.48+RADIUS&&p.y<disc.y+.1&&p.y+BODY>disc.y-.1){die(s,'DISC INTERCEPTED YOU');return;}
  const q=pose(pad,s.t);if(pad.pickup&&!s.collected.includes(pad.id)&&Math.hypot(p.x-q.x-pad.pickupX,p.z-q.z)<.7&&p.y<q.y+1.5&&p.y+BODY>q.y+.65){s.collected.push(pad.id);if(pad.pickup==='life'){s.lives++;s.events.push('extra-life');}else{s.flyUntil=s.t+5;s.events.push('flight');}}
 }
 s.height=Math.max(s.height,p.y);if(p.y<s.lava+.12)die(s,'THE VOID CAUGHT UP');else if(p.y<s.height-12)die(s,'LOST YOUR FOOTING');
}
export function die(s,reason){if(s.dead)return;s.dead=true;s.lives=Math.max(0,s.lives-1);s.reason=reason;s.events.push('death');}
export function score(s){return Math.max(0,s.highest*1000+Math.floor(s.height*10)-Math.floor(s.elapsed*2));}
// Automated route follower for regression checks; gameplay never invokes it.
export function botInput(s,target){
 const p=s.p,q=pose(target,s.t+.25);if(target.lanes)q.x+=target.lanes[0].x;
 const dx=q.x-p.x,dz=q.z-p.z,dist=Math.hypot(dx,dz);
 const wait=p.ground!==null&&((target.type==='gates'&&(!gateOpen(target,s.t+.55)||(target.id%4===1&&(!gateOpen(target,s.t+1.5)||!gateOpen(target,s.t+2.5)))))||(target.type==='pulse'&&(!active(target,s.t+.65)||(target.id%4===1&&!active(target,s.t+2.6)))));
 if(wait){const ground=s.pads.get(p.ground),rest=pose(ground,s.t);if(ground.lanes)rest.x+=ground.lanes[0].x;return{x:Math.max(-1,Math.min(1,(rest.x-p.x)*2-p.vx*.18)),z:0,jump:false};}
 return{x:Math.max(-1,Math.min(1,dx*2-p.vx*.18)),z:wait?0:Math.max(-1,Math.min(1,dz*2-p.vz*.18)),jump:!wait&&p.ground!==null&&p.ground!==target.id&&dist<4.8&&(target.type!=='pulse'||active(target,s.t+.6))};
}
