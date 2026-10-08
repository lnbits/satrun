import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {pose,active,gateOpen,slabAngle,discPoses} from './physics.js';
export const DISTRICTS=[
 {name:'THE GRID',next:'CIPHER GARDENS',color:0x35eaff,fog:0x040c19},
 {name:'CIPHER GARDENS',next:'VIOLET ARCHIVE',color:0x57ffc5,fog:0x031611},
 {name:'VIOLET ARCHIVE',next:'SOLAR REACTOR',color:0xbc83ff,fog:0x10081f},
 {name:'SOLAR REACTOR',next:'GHOST PROTOCOL',color:0xffb344,fog:0x190c08},
 {name:'GHOST PROTOCOL',next:'THE GRID',color:0x9ecfff,fog:0x081321}
];
const cyan=0x35eaff,gold=0xffac38,red=0xff405e;
export const materials={floor:new T.MeshStandardMaterial({color:0x101e29,metalness:.4,roughness:.38}),side:new T.MeshStandardMaterial({color:0x14212d,metalness:.4,roughness:.45}),suit:new T.MeshStandardMaterial({color:0x273e4b,metalness:.55,roughness:.28}),joint:new T.MeshStandardMaterial({color:0x080d13,metalness:.45,roughness:.5}),helmet:new T.MeshStandardMaterial({color:0x284454,metalness:.7,roughness:.18})};
const lightMat=(c,p=1.8)=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:p,roughness:.3,metalness:.2});
export const glow=lightMat(cyan),amber=lightMat(gold),hazard=lightMat(red);
function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
export function box(parent,x,y,z,w,h,d,m){return mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z);}
function line(parent,a,b,r,m){const p=new T.Vector3(...a),q=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,p.distanceTo(q),8),m,parent);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o;}
export function runner(parent){
 const armor=new T.MeshStandardMaterial({color:0xd6e4ed,metalness:.18,roughness:.42});
 const shell=new T.MeshStandardMaterial({color:0xf0f5f7,metalness:.28,roughness:.3});
 const signal=lightMat(0xff922e,1.3);
 const g=new T.Group();parent.add(g);g.userData.legs=[];g.userData.arms=[];g.userData.knees=[];
 // A compact armored courier: broad shoulders, narrow waist and a readable light disc.
 const torso=mesh(new T.CapsuleGeometry(.26,.36,6,12),armor,g,0,1.43,0);torso.scale.set(1,.95,.64);
 const chest=box(g,0,1.54,-.145,.42,.36,.12,shell);chest.rotation.x=-.12;
 box(g,0,1.12,0,.39,.17,.29,materials.joint);box(g,0,1.2,-.17,.36,.035,.025,signal);
 for(const side of[-1,1]){
  line(g,[side*.23,1.72,-.2],[side*.08,1.42,-.22],.016,signal);
  line(g,[side*.18,1.73,.18],[side*.13,1.18,.18],.016,signal);
 }
 const helmet=mesh(new T.SphereGeometry(.275,16,12),shell,g,0,2.01,-.015);helmet.scale.set(.94,1.02,1.07);
 const visor=mesh(new T.SphereGeometry(.279,24,12,Math.PI,Math.PI,Math.PI*.38,Math.PI*.2),materials.joint,g,0,2.01,-.015);visor.scale.copy(helmet.scale);
 const visorLight=mesh(new T.SphereGeometry(.281,24,8,Math.PI*1.05,Math.PI*.9,Math.PI*.46,Math.PI*.045),signal,g,0,2.01,-.015);visorLight.scale.copy(helmet.scale);
 for(const side of[-1,1]){box(g,side*.258,2.02,0,.025,.055,.15,signal);box(g,side*.17,1.82,-.13,.07,.08,.12,armor);}
 box(g,0,2.265,.015,.045,.015,.23,signal);
 mesh(new T.CylinderGeometry(.11,.13,.1,12),materials.joint,g,0,1.78,0);
 mesh(new T.CircleGeometry(.225,32),materials.joint,g,0,1.5,.205);
 mesh(new T.TorusGeometry(.205,.027,8,40),signal,g,0,1.5,.23);
 mesh(new T.TorusGeometry(.14,.009,6,32),amber,g,0,1.5,.238);
 box(g,0,1.5,.24,.03,.08,.015,signal);
 for(const side of[-1,1]){
  const leg=new T.Group();leg.position.set(side*.16,1.06,0);g.add(leg);g.userData.legs.push(leg);
  line(leg,[0,0,0],[0,-.45,0],.105,armor);box(leg,side*.06,-.21,-.08,.11,.3,.075,shell);line(leg,[side*.09,-.06,-.07],[side*.09,-.37,-.07],.014,signal);
  const knee=new T.Group();knee.position.y=-.46;leg.add(knee);g.userData.knees.push(knee);
  mesh(new T.SphereGeometry(.11,12,8),materials.joint,knee);box(knee,0,0,-.1,.14,.14,.075,shell);
  line(knee,[0,-.04,0],[0,-.44,0],.074,armor);box(knee,0,-.24,-.07,.13,.29,.065,shell);line(knee,[side*.07,-.1,-.1],[side*.07,-.39,-.1],.013,signal);
  box(knee,0,-.51,-.075,.2,.15,.35,materials.joint);box(knee,0,-.46,-.13,.18,.06,.22,armor);box(knee,0,-.54,-.08,.21,.023,.36,signal);
  const arm=new T.Group();arm.position.set(side*.32,1.7,0);g.add(arm);g.userData.arms.push(arm);
  const shoulder=mesh(new T.SphereGeometry(.16,12,8),shell,arm);shoulder.scale.set(1,.78,1);box(arm,side*.09,.03,-.09,.12,.03,.15,signal);
  line(arm,[0,0,0],[side*.055,-.31,0],.075,armor);mesh(new T.SphereGeometry(.075,12,8),materials.joint,arm,side*.055,-.32,0);
  line(arm,[side*.055,-.32,0],[side*.055,-.53,-.17],.067,armor);box(arm,side*.055,-.41,-.095,.115,.17,.13,shell);
  line(arm,[side*.09,-.34,-.1],[side*.09,-.48,-.2],.016,side===1?amber:signal);mesh(new T.SphereGeometry(.075,10,8),materials.joint,arm,side*.055,-.56,-.19);
 }
 return g;
}
function setup(element,bg=0x060b11){const s=new T.Scene();s.background=new T.Color(bg);const w=element.clientWidth,h=element.clientHeight,r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(w,h);r.setPixelRatio(1.5);r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1; element.appendChild(r.domElement);const env=new T.PMREMGenerator(r);s.environment=env.fromScene(new RoomEnvironment(),.04).texture;s.environmentIntensity=.28;s.add(new T.HemisphereLight(0xa9d7e8,0x0b1220,1.2));const key=new T.DirectionalLight(0xbbdbe8,2);key.position.set(-8,12,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.1,far:80});key.shadow.bias=-.0003;s.add(key);const c=new T.PerspectiveCamera(52,w/h,.1,600);return{s,r,c,w,h};}
export function createView(element){
 const {s,r,c}=setup(element);r.setPixelRatio(Math.min(devicePixelRatio,1.5));s.fog=new T.FogExp2(0x040c19,.009);s.background=new T.Color(0x040c19);const player=runner(s),world=new T.Group();s.add(world);const groups=new Map();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const composer=new EffectComposer(r);composer.renderTarget1.samples=composer.renderTarget2.samples=Math.min(4,r.capabilities.maxSamples);composer.addPass(new RenderPass(s,c));
 // Extract thin neon edges at full resolution; blur stays downsampled to keep the glow soft.
 const bloom=new UnrealBloomPass(new T.Vector2(1,1),.24,.3,1.4);composer.addPass(bloom);composer.addPass(new OutputPass());
 const circuitCanvas=document.createElement('canvas');circuitCanvas.width=circuitCanvas.height=256;
 const ink=circuitCanvas.getContext('2d');ink.fillStyle='#091c2b';ink.fillRect(0,0,256,256);
 ink.strokeStyle='#164153';ink.lineWidth=1;for(let i=0;i<=256;i+=32){ink.beginPath();ink.moveTo(i,0);ink.lineTo(i,256);ink.moveTo(0,i);ink.lineTo(256,i);ink.stroke();}
 ink.strokeStyle='#287083';ink.lineWidth=2;for(const x of[24,232]){ink.beginPath();ink.moveTo(x,256);ink.lineTo(x,160);ink.lineTo(x+(x<128?24:-24),136);ink.lineTo(x+(x<128?24:-24),40);ink.stroke();}
 const circuit=new T.CanvasTexture(circuitCanvas);circuit.colorSpace=T.SRGBColorSpace;
 const deck=new T.MeshStandardMaterial({map:circuit,color:0xb3dfec,metalness:.65,roughness:.28,emissiveMap:circuit,emissive:0x51d6ff,emissiveIntensity:.5});
 const trim=new T.MeshBasicMaterial({color:0x185e75});
 const labelTextures=new Map();
 function label(parent,text,x,y,z,width,color='#71f3ff'){
  const key=text+color;let texture=labelTextures.get(key);
  if(!texture){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font='500 48px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;labelTextures.set(key,texture);}
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});
  const sign=mesh(new T.PlaneGeometry(width,width/4),material,parent,x,y,z);sign.castShadow=false;sign.userData.ownedMaterial=true;return sign;
 }
 let feedback=0;const ripple=mesh(new T.RingGeometry(.65,.72,48),new T.MeshBasicMaterial({color:cyan,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),s);ripple.rotation.x=-Math.PI/2;ripple.castShadow=false;
 const trailGeo=new T.BufferGeometry(),trailPos=new Float32Array(36*3);trailGeo.setAttribute('position',new T.BufferAttribute(trailPos,3));const trail=new T.Line(trailGeo,new T.LineBasicMaterial({color:cyan,transparent:true,opacity:.65,depthWrite:false}));trail.frustumCulled=false;s.add(trail);const trailPoints=[];
 function effect(event,p){
  if(event==='land'||event==='bounce'||event==='floor'||event==='checkpoint'){
   burst(p,event==='checkpoint'?60:event==='floor'?24:10);feedback=1;ripple.position.set(p.x,p.y+.055,p.z);ripple.material.color.set(event==='checkpoint'||event==='floor'?gold:cyan);
  }
  if(event==='death')burst(p,40);
 }

 const districtGlow=glow.clone();districtGlow.emissiveIntensity=1.6;
 const ghostMat=new T.MeshBasicMaterial({color:0x834caa,transparent:true,opacity:.23,wireframe:true});const typeMats={steps:districtGlow,balance:districtGlow,conveyor:districtGlow,drift:districtGlow,lift:districtGlow,pulse:lightMat(0xbf7cff),crumble:lightMat(0xffa67b),ice:lightMat(0x91c5ff),bounce:amber,sweeper:districtGlow,gates:districtGlow,split:districtGlow};
 const grid=new T.GridHelper(240,70,0x8f392f,0x321c25);s.add(grid);const voidField=mesh(new T.PlaneGeometry(240,240),new T.MeshBasicMaterial({color:0x4c1c25,transparent:true,opacity:.4,side:T.DoubleSide}),s);voidField.rotation.x=-Math.PI/2;
 const backdrop=new T.Group();s.add(backdrop);
 const skyline=new T.MeshBasicMaterial({color:0x12364c}),cityLight=new T.MeshBasicMaterial({color:0x228ba5});
 for(let i=0;i<38;i++){
  const side=i%2?1:-1,x=side*(20+(i*13%39)),z=35-i*6,height=22+i%9*7,w=2+i%4;
  box(backdrop,x,height/2-22,z,w,height,4,materials.side);
  const edges=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w,height,4)),new T.LineBasicMaterial({color:0x164960}));edges.position.set(x,height/2-22,z);backdrop.add(edges);
  box(backdrop,x-side*(w/2+.01),height/2-22,z,.03,height,.08,i%5===0?amber:cityLight);
  for(let j=0;j<5;j++)box(backdrop,x,-15+j*height/6,z+2.02,w*.65,.06,.02,skyline);
 }
 // Open architectural ribs frame the climb without obscuring the landing surfaces.
 for(let i=0;i<7;i++){
  const z=-i*22,y=-z/4.25*1.25-4;
  line(backdrop,[-14,y-12,z],[-14,y+14,z],.07,trim);line(backdrop,[14,y-12,z],[14,y+14,z],.07,trim);
  line(backdrop,[-14,y+14,z],[-7,y+21,z],.07,trim);line(backdrop,[14,y+14,z],[7,y+21,z],.07,trim);line(backdrop,[-7,y+21,z],[7,y+21,z],.07,trim);
 }
 const halo=mesh(new T.TorusGeometry(26,.12,8,128),new T.MeshBasicMaterial({color:0x187087}),backdrop,0,45,-145);halo.castShadow=false;
 backdrop.traverse(o=>{o.castShadow=false;});
 const landmarks=new T.Group();backdrop.add(landmarks);let districtIndex=-1;
 const landmarkMat=new T.MeshStandardMaterial({color:0x0b2630,metalness:.75,roughness:.22});
 const landmarkEdge=new T.LineBasicMaterial({color:cyan});
 function district(floor){
  const index=Math.floor(floor/3)%DISTRICTS.length;if(index===districtIndex)return;districtIndex=index;
  const theme=DISTRICTS[index];districtGlow.color.setHex(theme.color);districtGlow.emissive.setHex(theme.color);trim.color.setHex(theme.color).multiplyScalar(.24);cityLight.color.setHex(theme.color).multiplyScalar(.5);landmarkEdge.color.setHex(theme.color);s.background.setHex(theme.fog);s.fog.color.setHex(theme.fog);
  landmarks.traverse(o=>o.geometry?.dispose());landmarks.clear();
  for(let i=0;i<12;i++){
   const side=i%2?1:-1,x=side*(10+i%3*4),z=4-Math.floor(i/2)*19,y=-z/4.25*1.25+3;
   const g=new T.Group();g.position.set(x,y,z);landmarks.add(g);
   if(index===1){
    const crystal=mesh(new T.OctahedronGeometry(2.2,0),landmarkMat,g);crystal.scale.set(.7,2.8,.7);const edge=new T.LineSegments(new T.EdgesGeometry(crystal.geometry),landmarkEdge);edge.scale.copy(crystal.scale);g.add(edge);
    const orbit=mesh(new T.TorusGeometry(2.4,.035,6,48),districtGlow,g);orbit.rotation.x=Math.PI*.35;
   }else if(index===2){
    for(let j=0;j<3;j++){const ring=mesh(new T.TorusGeometry(2.1-j*.3,.045,6,48),districtGlow,g,0,j*1.5,0);ring.rotation.set(Math.PI/2+j*.35,j*.4,0);}
    mesh(new T.OctahedronGeometry(.65),districtGlow,g,0,1.5,0);
   }else if(index===3){
    mesh(new T.CylinderGeometry(1.5,2,1,8),materials.side,g,0,-2,0);box(g,0,1,0,.16,6,.16,districtGlow);
    const ring=mesh(new T.TorusGeometry(2.1,.09,6,6),districtGlow,g,0,1,0);ring.rotation.y=side*.6;
   }else if(index===4){
    for(let j=0;j<3;j++){const edge=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(3+j*.6,5+j*.6,3+j*.6)),landmarkEdge);edge.rotation.y=j*.35;g.add(edge);}
    box(g,0,0,0,.1,6,.1,districtGlow);
   }else{
    for(const sign of[-1,1])line(g,[sign*1.8,-2,0],[sign*1.8,3,0],.045,districtGlow);
    line(g,[-1.8,3,0],[0,4.8,0],.045,districtGlow);line(g,[0,4.8,0],[1.8,3,0],.045,districtGlow);
   }
  }
  landmarks.traverse(o=>{o.castShadow=false;});
 }
 const particleGeo=new T.BufferGeometry(),particlePos=new Float32Array(90*3),particleList=[];particleGeo.setAttribute('position',new T.BufferAttribute(particlePos,3));const sparks=new T.Points(particleGeo,new T.PointsMaterial({color:cyan,size:.12,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending}));sparks.frustumCulled=false;s.add(sparks);
 const forward=new T.Vector3();
 function movement(x,z){c.getWorldDirection(forward);forward.y=0;forward.normalize();return{x:-forward.z*x-forward.x*z,z:forward.x*x-forward.z*z};}
 const orbit={yaw:0,pitch:.598,distance:16,reset(){this.yaw=0;this.pitch=.598;this.distance=16;}};let camY=0,camZ=0,camX=0,ready=false;
 function platform(p){
  const g=new T.Group(),solid=new T.Group(),edge=p.checkpoint||p.target?amber:(typeMats[p.type]||districtGlow);g.add(solid);world.add(g);g.userData.solid=solid;
  function slab(parent,w,d,accent,shape='rect',ramp=false){const top=new T.Group();parent.add(top);
   if(ramp){top.rotation.x=Math.atan(1.25/4.25);top.scale.z=1/Math.cos(top.rotation.x);}
   if(shape==='circle'){
    mesh(new T.CylinderGeometry(w/2,w/2,.44,48),materials.side,top,0,-.22,0);
    const face=mesh(new T.CircleGeometry(w/2-.07,48),deck,top,0,.008,0);face.rotation.x=-Math.PI/2;
    const rim=mesh(new T.TorusGeometry(w/2-.04,.045,6,64),accent,top,0,.025,0);rim.rotation.x=Math.PI/2;
   }else{
    box(top,0,-.22,0,w,.44,d,materials.side);box(top,0,.005,0,w-.13,.025,d-.13,deck);
    for(const side of[-1,1]){box(top,side*(w/2-.03),.025,0,.04,.025,d-.06,accent);box(top,0,.025,side*(d/2-.03),w-.06,.025,.04,accent);}
   }
   if(shape!=='circle'){
    for(const side of[-1,1]){box(top,side*(w/2-.03),-.32,0,.045,.07,d,accent);for(const z of[-d*.36,d*.36])box(top,side*w*.36,-.55,z,Math.min(.5,w*.18),.22,.5,materials.joint);}
    // Chevron points in the direction of travel; deck dimensions still match collision surfaces.
    if(w>2){line(top,[-.3,.045,.15],[0,.045,-.15],.022,accent);line(top,[0,.045,-.15],[.3,.045,.15],.022,accent);}
   }
   return top;
  }
  let surface;
  if(p.lanes){for(const [i,l]of p.lanes.entries()){const lane=new T.Group();lane.position.x=l.x;solid.add(lane);slab(lane,l.w,l.d,i?amber:glow);for(const side of[-1,1])box(lane,side*l.w*.3,.035,0,.02,.01,l.d-.4,i?amber:glow);}}
  else surface=slab(solid,p.w,p.d,edge,p.shape,p.ramp);
  if(surface&&p.shape!=='circle')for(let i=-1;i<=1;i++)box(surface,i*.23,.027,0,.012,.008,p.d-.3,new T.MeshBasicMaterial({color:0x3f6473}));
  if(p.checkpoint){
   label(solid,'CHECKPOINT',0,4.05,-p.d/2,4,'#ffb344');
  }
  if(p.type==='crumble'&&surface){for(const side of[-1,1])line(surface,[side*p.w*.35,.045,-p.d*.4],[side*.15,.045,p.d*.4],.018,amber);}
  if(p.type==='pulse'){const signal=mesh(new T.TorusGeometry(.2,.035,6,24),typeMats.pulse,solid,0,-.5,p.d/2+.02);g.userData.signal=signal;}
  if(p.type==='balance'){for(const side of[-1,1])line(solid,[side*p.w*.3,-.3,0],[side*p.w*.3,-2,0],.022,glow);}
  if(p.type==='drift'){const track=new T.Group();g.add(track);box(track,0,-.85,0,8,.08,.08,materials.joint);box(track,0,-.8,0,8,.025,.025,glow);for(const x of[-4,4])box(track,x,-.75,0,.15,.3,.4,materials.side);g.userData.track=track;}
  if(p.type==='pulse'){const ghost=mesh(new T.BoxGeometry(p.w,.05,p.d),ghostMat,g);g.userData.ghost=ghost;}
  if(p.type==='conveyor'){for(let i=-1;i<=1;i++){const a=box(surface,-.18,.045,i*.7,.04,.025,.45,edge),b=box(surface,.18,.045,i*.7,.04,.025,.45,edge);a.rotation.y=-.7;b.rotation.y=.7;}}
  if(p.type==='bounce'){for(const radius of[.4,.85,1.3]){const ring=mesh(new T.TorusGeometry(radius,.035,6,48),amber,solid,0,.04,0);ring.rotation.x=Math.PI/2;}mesh(new T.CylinderGeometry(.28,.4,.18,6),amber,solid,0,.1,0);}
  if(p.target){const ring=mesh(new T.TorusGeometry(.7,.03,6,48),amber,solid,0,.035,0);ring.rotation.x=Math.PI/2;for(const side of[-1,1]){box(solid,side*.9,.035,0,.28,.025,.025,amber);box(solid,0,.035,side*.9,.025,.025,.28,amber);}}
  if(p.type==='sweeper'){const sweep=new T.Group();solid.add(sweep);sweep.position.y=.5;box(sweep,0,0,0,p.w*.8,.12,.15,hazard);for(const side of[-1,1]){box(sweep,side*p.w*.4,0,0,.2,.3,.3,materials.joint);box(sweep,side*p.w*.4,0,.16,.18,.12,.025,hazard);}mesh(new T.CylinderGeometry(.25,.35,.45,16),materials.joint,solid,0,.23,0);mesh(new T.SphereGeometry(.12,12,8),amber,solid,0,.57,0);g.userData.sweep=sweep;const ring=mesh(new T.TorusGeometry(p.w*.36,.012,5,64),glow,solid,0,.025,0);ring.rotation.x=Math.PI/2;}
  if(p.type==='gates'){for(const side of[-1,1])box(solid,side*(p.w/2-.12),1.5,0,.12,3,.16,glow);box(solid,0,3.05,0,p.w,.12,.16,glow);const field=mesh(new T.PlaneGeometry(p.w-.3,3),new T.MeshBasicMaterial({color:red,transparent:true,opacity:.16,side:T.DoubleSide}),solid,0,1.5,0);const lasers=new T.Group();solid.add(lasers);lasers.add(field);for(let y=.25;y<3;y+=.4)box(lasers,0,y,0,p.w-.3,.035,.035,hazard);g.userData.gate=lasers;
box(surface,0,.04,.8,p.w-.4,.025,.045,amber);}
  if(p.checkpoint){for(const side of[-1,1])box(solid,side*(p.w/2-.3),1.8,-p.d/2+.2,.06,3.6,.06,amber);box(solid,0,3.6,-p.d/2+.2,p.w-.6,.06,.06,amber);}
  if(p.discs){g.userData.discs=[];for(let i=0;i<(p.floor>=20?2:1);i++){const disc=new T.Group();g.add(disc);const rim=mesh(new T.TorusGeometry(.43,.05,6,32),hazard,disc);rim.rotation.x=Math.PI/2;mesh(new T.CylinderGeometry(.35,.35,.1,24),materials.joint,disc);box(disc,0,.055,0,.5,.02,.045,amber);g.userData.discs.push(disc);}const ports=p.discs==='front'?[[0,-6]]:[[-6,0],[6,0]];for(const [x,z]of ports){const port=mesh(new T.TorusGeometry(.38,.04,6,24),amber,g,x,.68,z);if(p.discs==='side')port.rotation.y=Math.PI/2;}}
  if(p.pickup){const pickup=new T.Group();g.add(pickup);pickup.position.set(p.pickupX,1,0);const ring=mesh(new T.TorusGeometry(.38,.035,6,32),amber,pickup);if(p.pickup==='life'){box(pickup,0,0,0,.4,.09,.09,amber);box(pickup,0,0,0,.09,.4,.09,amber);}else{line(pickup,[-.25,-.1,0],[0,.2,0],.06,glow);line(pickup,[0,.2,0],[.25,-.1,0],.06,glow);}g.userData.pickup=pickup;}
  return g;
 }
 function burst(p,count=12){for(let i=0;i<count;i++)particleList.push({x:p.x,y:p.y+.05,z:p.z,vx:(Math.random()-.5)*3,vy:1+Math.random()*3,vz:(Math.random()-.5)*3,life:.35+Math.random()*.3});}
 function draw(state,dt=1/60,snap=false){
  district(state.highest);
  if(snap){for(const g of groups.values()){world.remove(g);g.traverse(o=>o.geometry?.dispose());}groups.clear();}
  const p=state.p,index=Math.floor(-p.z/4.25);for(const [id,g]of groups)if(!state.pads.has(id)||id<index-3||id>index+19){world.remove(g);g.traverse(o=>{o.geometry?.dispose();if(o.userData.ownedMaterial)o.material.dispose();});groups.delete(id);}
  for(const pad of state.pads.values()){if(pad.id<index-3||pad.id>index+19)continue;let g=groups.get(pad.id);if(!g){g=platform(pad);groups.set(pad.id,g);}const q=pose(pad,state.t);g.position.set(q.x,q.y,q.z);const live=active(pad,state.t)&&q.y>state.lava;g.userData.solid.visible=live;if(g.userData.ghost)g.userData.ghost.visible=!live&&q.y>state.lava;if(g.userData.sweep)g.userData.sweep.rotation.y=-(state.t*pad.rate+pad.phase);if(g.userData.track)g.userData.track.position.x=pad.x-q.x;if(g.userData.gate)g.userData.gate.visible=!gateOpen(pad,state.t);if(g.userData.signal&&!reduced)g.userData.signal.scale.setScalar(1+.2*Math.sin(state.t*4));}
  for(const pad of state.pads.values()){const g=groups.get(pad.id);if(!g)continue;g.userData.solid.rotation.y=-slabAngle(pad,state.t);if(g.userData.discs)discPoses(pad,state.t).forEach((d,i)=>{const disc=g.userData.discs[i];disc.position.set(d.x-g.position.x,d.y-g.position.y,d.z-g.position.z);disc.visible=d.visible&&active(pad,state.t)&&pad.y>state.lava;disc.rotation.y=state.t*8;});if(g.userData.pickup){g.userData.pickup.visible=pad.y>state.lava&&!state.collected.includes(pad.id);g.userData.pickup.rotation.y=state.t*1.5;}}
  player.position.set(p.x,p.y,p.z);const speed=Math.hypot(p.vx,p.vz);const facing=speed>.35?Math.atan2(-p.vx,-p.vz):player.rotation.y;player.rotation.y+=Math.atan2(Math.sin(facing-player.rotation.y),Math.cos(facing-player.rotation.y))*Math.min(1,dt*14);
  player.rotation.x=state.dead?.65:Math.max(-.12,Math.min(.12,-p.vz*.012));player.rotation.z=state.dead?Math.sin(state.t*12)*.3:-p.vx*.018;
  player.scale.set(1+state.land*.08,1-state.land*.12+(p.ground===null?.025:0),1+state.land*.08);
  const stride=Math.min(1,speed/6.4),air=p.ground===null;
  player.userData.legs.forEach((leg,i)=>{const wave=Math.sin(state.t*14+i*Math.PI);leg.rotation.x=air?(i?.3:-.65):wave*stride*.7;player.userData.knees[i].rotation.x=-(air?.85:Math.max(0,-wave)*stride*1.05+state.land*.25);});
  player.userData.arms.forEach((arm,i)=>{arm.rotation.x=air?-.6:-Math.sin(state.t*14+i*Math.PI)*stride*.7;arm.rotation.z=(i?1:-1)*(air?.25:.08);});
  if(snap){trailPoints.length=0;particleList.length=0;feedback=0;}
  if(!reduced&&speed>.4&&!state.dead){trailPoints.unshift(new T.Vector3(p.x,p.y+.12,p.z));if(trailPoints.length>36)trailPoints.pop();}else if(trailPoints.length)trailPoints.pop();
  trailPoints.forEach((v,i)=>v.toArray(trailPos,i*3));trailGeo.setDrawRange(0,trailPoints.length);trailGeo.attributes.position.needsUpdate=true;
  if(!reduced)landmarks.children.forEach((g,i)=>{if(districtIndex===1||districtIndex===2||districtIndex===4)g.rotation.y+=dt*(i%2?1:-1)*.12;});
  feedback=Math.max(0,feedback-dt*2.6);ripple.visible=!reduced&&feedback>0;ripple.scale.setScalar(1+(1-feedback)*3);ripple.material.opacity=feedback*.7;
  for(let i=particleList.length-1;i>=0;i--){const e=particleList[i];e.life-=dt;if(e.life<0)particleList.splice(i,1);else{e.x+=e.vx*dt;e.y+=e.vy*dt;e.z+=e.vz*dt;e.vy-=8*dt;}}
  for(let i=0;i<90;i++){const e=particleList[i];particlePos[i*3]=e?.x||0;particlePos[i*3+1]=e?.y??-10000;particlePos[i*3+2]=e?.z||0;}particleGeo.attributes.position.needsUpdate=true;
  // Height follows the course rather than bobbing with every jump.
  const courseY=Math.max(0,-p.z/4.25*1.25);if(!ready||snap){camY=courseY;camZ=p.z;camX=p.x*.35;ready=true;}
  const damp=1-Math.exp(-dt*6);camY+=(courseY-camY)*damp;camZ+=(p.z-camZ)*damp;camX+=(p.x*.35-camX)*damp;
  const horizontal=orbit.distance*Math.cos(orbit.pitch),vertical=orbit.distance*Math.sin(orbit.pitch),sy=Math.sin(orbit.yaw),cy=Math.cos(orbit.yaw);c.position.set(camX+sy*horizontal,camY+vertical,camZ+cy*horizontal);c.lookAt(camX-sy*12.8,camY,camZ-cy*12.8);grid.position.set(0,state.lava,Math.floor(p.z/8)*8);voidField.position.set(0,state.lava-.08,p.z-25);backdrop.position.set(0,courseY,p.z);
  const sunlight=s.children.find(o=>o.isDirectionalLight);sunlight.position.set(-8,courseY+18,p.z+10);sunlight.target.position.set(0,courseY,p.z-8);sunlight.target.updateMatrixWorld();
  composer.render();return{camera:c.position.toArray(),cameraForward:c.getWorldDirection(new T.Vector3()).toArray(),runnerForward:new T.Vector3(0,0,-1).applyQuaternion(player.quaternion).toArray(),target:[camX,camY,camZ-12.8],screen:new T.Vector3(p.x,p.y+1,p.z).project(c).toArray(),nextScreen:state.pads.get(state.lastPad+1)?new T.Vector3(...(()=>{const q=pose(state.pads.get(state.lastPad+1),state.t);return[q.x,q.y,q.z];})()).project(c).toArray():null};
 }
 function resize(){const w=element.clientWidth,h=element.clientHeight;r.setSize(w,h);composer.setSize(w,h);bloom.renderTargetBright.setSize(w*r.getPixelRatio(),h*r.getPixelRatio());c.aspect=w/h;c.fov=w/h<.8?65:52;c.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(element);resize();return{draw,renderer:r,camera:c,orbit,burst,movement,effect};
}
