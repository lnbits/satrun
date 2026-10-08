// Offline renderer regression: real bundled UI, strict CSP, no backend writes.
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {moduleFor} from './physics.js';
const require=createRequire('/home/talvasconcelos/Work/lnbits_pg/'),{chromium}=require('playwright');
const root=new URL('../',import.meta.url),errors=[];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://satrun.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/')return route.fulfill({contentType:'text/html',body:readFileSync(new URL('ui/public.html',root),'utf8'),headers:{'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'"}});
  if(path.endsWith('lnbits-extension-sdk.js'))return route.fulfill({contentType:'text/javascript',body:'window.satBridge=async()=>{throw Error("Offline renderer test")};'});
  if(path.includes('_lnbits'))return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body:''});
  const file=path.replace('/ext-assets/satrun/','static/');return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body:readFileSync(new URL(file,root))});
 });
 await page.goto('http://satrun.test/?test=1');await page.waitForFunction(()=>!!window.satTest);
 await page.locator('#game').screenshot({path:new URL('evidence/tron-menu.png',root).pathname});
 await page.locator('#start').click();await page.waitForFunction(()=>satTest.phase()==='playing');
 const views=[[0,'steps'],[2,'balance'],[3,'crossing'],[4,'arena'],[5,'gates'],[6,'split'],[7,'launch'],[10,'checkpoint'],[12,'ghost'],[8,'frontdiscs'],[10,'parkour'],[11,'sidediscs'],[12,'rotor'],[14,'staggered-gates']];
 const seed=await page.evaluate(()=>satTest.state().seed);
 const extra=['pulse','crumble','conveyor','lift','ice'].map(type=>{let floor=1;while(floor<150&&moduleFor(seed,floor)!==type)floor++;assert(floor<150,'Module exists: '+type);return[floor-1,type];});
 for(const [floor,name]of process.argv.includes('--glow')?[[0,'steps'],[10,'checkpoint']]:process.argv.includes('--extra')?extra:views){
  await page.evaluate(f=>{satTest.practicePose(f);},floor);await page.waitForTimeout(80);
  await page.locator('#game').screenshot({path:new URL('evidence/tron-'+name+'.png',root).pathname});
  assert(await page.locator('#district-name').textContent(),'District name visible');
  const projection=await page.evaluate(()=>satTest.projection());assert(Math.abs(projection.screen[0])<.8&&Math.abs(projection.screen[1])<.9,'Runner remains framed');
 }
 await page.evaluate(()=>satTest.practicePose(0));await page.locator('#view').focus();await page.keyboard.press('Space');await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('w');assert((await page.evaluate(()=>satTest.state().p.y))>0,'Jump works');
 await page.keyboard.press('Escape');await page.locator('#resume').click();assert.equal(await page.evaluate(()=>satTest.phase()),'playing');
 await page.evaluate(()=>satTest.die());await page.locator('#restart').click();assert.equal(await page.evaluate(()=>satTest.state().highest),0);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{satTest.practicePose(0);satTest.die();});await page.locator('#home').click();await page.locator('#game').screenshot({path:new URL('evidence/tron-mobile-menu.png',root).pathname});
 await page.locator('#start').click();await page.locator('#game').screenshot({path:new URL('evidence/tron-mobile.png',root).pathname});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No mobile horizontal overflow');
 assert.deepEqual(errors,[]);console.log('PASS:',process.argv.includes('--glow')?'platform/checkpoint glow':process.argv.includes('--extra')?'phase/crumble/conveyor/lift/ice':'course views / five districts','desktop/mobile layouts, keyboard jump, pause/resume, restart, strict CSP; no JS errors. Offline practice only.');
}finally{await browser.close();}
