import {padFor} from './physics.js';

// Compact snapshots retain compatibility with existing saved runs.
const fields=['seed','frequency','difficulty','t','elapsed','floor','highest','height','highestTime','checkpoint','lava','dead','milestones','center','lastPad','land','continued','lives','paid','collected','flyUntil','reason'];
const playerFields=['x','y','z','vx','vy','vz','ground','coyote','buffer'];
export function packReplay(s,base){
 const values=fields.map(k=>base&&['seed','frequency','difficulty'].includes(k)?null:k==='collected'&&base?s.collected.filter(id=>!base.collected.includes(id)):k==='milestones'&&base?Object.fromEntries(Object.entries(s.milestones).filter(([id])=>!(id in base.milestones))):s[k]??null);
 // Only crumble/sweeper trigger times affect physics. Other landing timestamps
 // have no effect and need neither authentication nor persistence.
 const triggers=[];for(const [id,p]of s.pads)if(p.trigger!==null){const type=p.type||s.pads.get(id).type;if(type==='crumble'||type==='sweeper')triggers.push([id,p.trigger]);}
 return JSON.stringify([values,playerFields.map(k=>s.p[k]),[...s.pads.keys()],triggers]);
}
export function unpackReplay(json,base){
 const data=JSON.parse(json);let s;
 if(Array.isArray(data)){const [values,player,ids,triggerPairs]=data,triggers=new Map(triggerPairs);s=Object.fromEntries(fields.map((k,i)=>[k,values[i]]));if(s.reason===null)delete s.reason;s.p=Object.fromEntries(playerFields.map((k,i)=>[k,player[i]]));s.events=[];s.pads=new Map(ids.map(id=>[id,{trigger:triggers.get(id)??null}]));}
 else{s=data;s.pads=new Map(s.pads.map(([id,p])=>[id,{trigger:p&&typeof p==='object'?p.trigger:p}]));}
 if(base){s.seed=base.seed;s.frequency=base.frequency;s.difficulty=base.difficulty;s.collected=[...base.collected,...s.collected];s.milestones={...base.milestones,...s.milestones};}
 // Rendering needs distant platforms; replay only touches nearby collisions.
 // Generate geometry on access rather than spending fuel on the whole course.
 const get=s.pads.get.bind(s.pads);s.pads.get=id=>{let p=get(id);if(p&&!p.type){p={...padFor(s.seed,id,s.frequency,s.difficulty),trigger:p.trigger};s.pads.set(id,p);}return p;};
 return s;
}

