import {newRun,step,pose,botInput,DT} from './physics.js';
for(const seed of ['2026-10-07','a','b']){const s=newRun(seed);let target=1;while(s.elapsed<150&&!s.dead&&target<45){if(s.p.ground===target)target++;const t=s.pads.get(target);if(!t)break;step(s,botInput(s,t));}console.log(seed,{target,time:s.elapsed,highest:s.highest,dead:s.dead,reason:s.reason,p:s.p});}
