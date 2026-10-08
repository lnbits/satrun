import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import {mkdirSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const buildRoot=fileURLToPath(new URL('.',import.meta.url));process.chdir(buildRoot);mkdirSync('dist',{recursive:true});
await build({absWorkingDir:buildRoot,entryPoints:['app.js'],bundle:true,format:'iife',target:'es2022',outfile:'../static/game.js',minify:true,legalComments:'eof'});
await build({absWorkingDir:buildRoot,entryPoints:['component.js'],bundle:true,format:'esm',target:'es2020',external:['lnbits:extension/host'],outfile:'dist/component.js'});
if(process.argv.includes('--ui'))process.exit(0);
const r=spawnSync('./node_modules/.bin/jco',['componentize','dist/component.js','--disable','all','--wit','../wasm/lnbits-extension.wit','--world-name','satrun','-o','../wasm/module.new.wasm'],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);renameSync('../wasm/module.new.wasm','../wasm/module.wasm');
