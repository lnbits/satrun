// Actual renderer, isolated thin neon edge: measure glow while the camera crosses pixels.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const require=createRequire('/home/talvasconcelos/Work/lnbits_pg/'),{chromium}=require('playwright'),root=new URL('../',import.meta.url);
const bundle=await build({stdin:{resolveDir:new URL('.',import.meta.url).pathname,contents:`
import * as T from 'three';
import {createView} from './view.js';
window.measure=()=>{
 const w=320,h=240,metrics=[];
 for(const before of [true,false]){
  const element=document.createElement('div');element.style.cssText='width:320px;height:240px';document.body.append(element);
  const view=createView(element),r=view.renderer,composer=view.composer,bloom=view.bloom,scene=composer.passes[0].scene;
  // Replace game content with one constant bright edge; retain the actual renderer and passes.
  scene.clear();scene.background=new T.Color(0);r.shadowMap.enabled=false;
  const camera=new T.OrthographicCamera(-40/3,40/3,10,-10,.1,100);camera.position.z=10;composer.passes[0].camera=camera;
  scene.add(new T.Mesh(new T.PlaneGeometry(10,.16),new T.MeshBasicMaterial({color:new T.Color(0,2.6,2.6)})));
  if(before){composer.renderTarget1.samples=composer.renderTarget2.samples=0;bloom.setSize(w*.5,h*.5);}
  const target=bloom.renderTargetsHorizontal[0],buffer=new Uint16Array(target.width*target.height*4),values=[];
  for(let i=0;i<32;i++){
   camera.position.y=i/32/12*4;composer.render();r.readRenderTargetPixels(target,0,0,target.width,target.height,buffer);
   let sum=0;for(let j=0;j<buffer.length;j+=4)sum+=T.DataUtils.fromHalfFloat(buffer[j+1]);values.push(sum/(buffer.length/4));
  }
  const mean=values.reduce((a,b)=>a+b)/values.length,variation=Math.sqrt(values.reduce((sum,v)=>sum+(v-mean)**2,0)/values.length)/mean;
  metrics.push({before,variation,min:Math.min(...values),max:Math.max(...values),bright:[bloom.renderTargetBright.width,bloom.renderTargetBright.height],blur:[target.width,target.height],samples:composer.renderTarget1.samples});bloom.dispose();composer.dispose();r.dispose();
 }
 return metrics;
};`},plugins:[{name:'test-render-buffers',setup(b){b.onLoad({filter:/\/view\.js$/},args=>({contents:readFileSync(args.path,'utf8').replace('return{draw,renderer:r,','return{composer,bloom,draw,renderer:r,'),loader:'js'}));}}],bundle:true,format:'iife',write:false});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:640,height:640}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setContent('<html><body></body></html>');await page.addScriptTag({content:bundle.outputFiles[0].text});const metrics=await page.evaluate(()=>measure()),[before,after]=metrics;
 assert.deepEqual(errors,[]);assert.deepEqual(after.bright,[320,240]);assert.deepEqual(after.blur,[160,120]);assert(after.samples>0,'Composer anti-aliasing enabled');assert.equal(before.min,0,'Original settings reproduce glow dropout');assert(after.min>0,'Corrected glow stays visible');assert(after.variation<before.variation*.3,'At least 70% less brightness variation');
 writeFileSync(new URL('evidence/glow-motion-results.json',root),JSON.stringify({metrics,errors,limits:'Synthetic camera sweep with actual renderer/passes in Chromium SwiftShader; physical device motion/performance remain manual.'},null,2));console.log('PASS actual glow pipeline: no dropout, '+Math.round((1-after.variation/before.variation)*100)+'% less brightness variation; full-resolution extraction, downsampled blur and composer anti-aliasing.');
}finally{await browser.close();}
