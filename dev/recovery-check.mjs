import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('app.js',import.meta.url),'utf8');
let calls=0,failures=3;
const {pump,runReport}=runInNewContext(source.slice(source.indexOf('function runReport('),source.indexOf('\nasync function finishJob'))+';({pump,runReport})',{
 setTimeout:resolve=>resolve(),api:async(path,p)=>{calls++;assert(!('frames'in p)&&!('proof'in p));if(failures-->0)throw Error('Unexpected error! too many clients already');return{runId:'checked_child'};}
});
const checkpoint={event:'checkpoint',floor:10,elapsed:40,highestTime:40,collected:[]},death={event:'death',floor:10,elapsed:41,highestTime:40,collected:[]};
const job={handle:{runId:'parent',token:'secret'},reports:[],eligible:true,error:'',inflight:null};
for(let i=0;i<2400;i++)await pump(job);assert.equal(calls,0,'No requests during ordinary movement');
job.reports.push(checkpoint,death);await pump(job);assert.equal(calls,3);assert(job.retryable&&job.error);assert.deepEqual(job.reports,[checkpoint,death],'Failed report stays ahead of death');assert(job.eligible);assert.equal(job.handle.runId,'parent');
job.error='';await pump(job);await pump(job);assert.equal(job.reports.length,0);assert.equal(job.handle.runId,'checked_child');
const collected=[16],snapshot=runReport({dead:false,highest:10,elapsed:40,highestTime:40,collected});collected.push(32);assert.deepEqual(Array.from(snapshot.collected),[16],'Queued report is a snapshot');
let resolve;const sent=[],stream={handle:{runId:'parent',token:'secret'},reports:[checkpoint,death],eligible:false,error:'',inflight:null};
const live=runInNewContext(source.slice(source.indexOf('async function pump('),source.indexOf('function end('))+';({pump,finishJob})',{
 job:null,api:async(path,p)=>{assert.equal(p.runId,sent.length?'child':'parent');sent.push(p.event);return new Promise(r=>resolve=r);}
});
const finished=live.finishJob(stream);live.pump(stream);assert.deepEqual(sent,['checkpoint'],'Only one request in flight');let active=stream.inflight;resolve({runId:'child'});await active;await Promise.resolve();assert.deepEqual(sent,['checkpoint','death']);active=stream.inflight;resolve({runId:'dead_child'});await active;await finished;assert(stream.done);
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{value:'runner',disabled:false,textContent:''});return elements.get(id);};let phase='result',started=false;
const start=runInNewContext(source.slice(source.indexOf('async function start('),source.indexOf('\nfunction runReport('))+';start',{
 unlock(){},closeInvoice(){},closeModal(){},keys:new Set(),touch:{},jumpPressed:false,$:get,towerId:'test_tower',api:async()=>{throw Error('too many clients already');},toast(){},setPhase:p=>phase=p,view:{draw:()=>started=true},newRun:()=>{started=true;},settings:{},day:'2026-10-08'
});
await start();assert.equal(phase,'menu');assert.equal(started,false);assert.equal(get('start').disabled,false);assert.match(get('connection').textContent,/Try again/);
console.log('PASS no movement calls, ordered milestone/death requests, lossless retry, immutable reports and explicit start failure.');
