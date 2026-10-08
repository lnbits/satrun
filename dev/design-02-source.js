import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
const cyan=0x36caee,gold=0xffb960,red=0xff614f;
const materials={floor:new T.MeshStandardMaterial({color:0x101e29,metalness:.4,roughness:.38}),side:new T.MeshStandardMaterial({color:0x14212d,metalness:.4,roughness:.45}),suit:new T.MeshStandardMaterial({color:0x273e4b,metalness:.55,roughness:.28}),joint:new T.MeshStandardMaterial({color:0x080d13,metalness:.45,roughness:.5}),helmet:new T.MeshStandardMaterial({color:0x284454,metalness:.7,roughness:.18})};
const lightMat=(c,p=1.05)=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:p,roughness:.3,metalness:.2});
const glow=lightMat(cyan),amber=lightMat(gold),hazard=lightMat(red);
function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(parent,x,y,z,w,h,d,m){return mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z);}
function line(parent,a,b,r,m){const p=new T.Vector3(...a),q=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,p.distanceTo(q),8),m,parent);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o;}
function runner(parent){const g=new T.Group();parent.add(g);
 // Adult proportions; articulated armor rather than a toy-like block mascot.
 const torso=mesh(new T.CapsuleGeometry(.24,.40,8,16),materials.suit,g,0,1.45,0);torso.scale.set(1,.94,.63);
 const hips=mesh(new T.CapsuleGeometry(.2,.1,6,12),materials.joint,g,0,1.02,0);hips.rotation.z=Math.PI/2;hips.scale.z=.7;
 const head=mesh(new T.SphereGeometry(.26,24,16),materials.helmet,g,0,2.04,-.025);head.scale.set(.92,1.08,1.04);
 const visor=mesh(new T.SphereGeometry(.265,24,12,0,Math.PI*2,Math.PI*.36,Math.PI*.24),new T.MeshStandardMaterial({color:0x071c29,metalness:1,roughness:.1,emissive:0x12354b,emissiveIntensity:.7}),g,0,2.04,-.04);visor.scale.set(.93,1.06,1.04);
 const rim=mesh(new T.TorusGeometry(.247,.009,6,36),glow,g,0,2.03,-.03);rim.rotation.x=Math.PI/2;rim.scale.set(.94,1,1);
 line(g,[-.12,1.79,.17],[-.12,1.18,.17],.013,glow);line(g,[.12,1.79,.17],[.12,1.18,.17],.013,glow);
 const disc=mesh(new T.TorusGeometry(.14,.021,8,32),glow,g,0,1.51,.18);mesh(new T.CircleGeometry(.115,24),materials.joint,g,0,1.51,.19);box(g,0,1.51,.205,.035,.09,.008,amber);
 for(const side of[-1,1]){
  const x=side*.16,knee=[x,.57,side===1?.13:-.12],ankle=[x,.12,side===1?.28:-.19];
  line(g,[x,1.02,0],knee,.108,materials.suit);mesh(new T.SphereGeometry(.115,12,8),materials.joint,g,...knee);line(g,knee,ankle,.083,materials.suit);
  line(g,[x+side*.066,.91,.085],[x+side*.066,.66,.10],.013,glow);line(g,[x+side*.048,.44,ankle[2]+.07],[x+side*.048,.16,ankle[2]+.07],.011,glow);
  const foot=box(g,ankle[0],.075,ankle[2]-.075,.19,.13,.33,materials.joint);box(g,ankle[0],.07,ankle[2]-.235,.15,.018,.014,glow);
  const shoulder=[side*.32,1.73,0],elbow=[side*.41,1.34,side===1?-.12:.10],hand=[side*.33,1.08,side===1?-.24:.20];mesh(new T.SphereGeometry(.135,12,8),materials.suit,g,...shoulder);line(g,shoulder,elbow,.075,materials.suit);line(g,elbow,hand,.068,materials.suit);mesh(new T.SphereGeometry(.076,12,8),materials.joint,g,...hand);line(g,[side*.365,1.68,.07],[side*.445,1.4,elbow[2]+.06],.011,glow);
 }
 return g;
}
function setup(element,bg=0x060b11){const s=new T.Scene();s.background=new T.Color(bg);const w=element.clientWidth,h=element.clientHeight,r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(w,h);r.setPixelRatio(1.5);r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1; element.appendChild(r.domElement);const env=new T.PMREMGenerator(r);s.environment=env.fromScene(new RoomEnvironment(),.04).texture;s.environmentIntensity=.45;s.add(new T.HemisphereLight(0xa9d7e8,0x0b1220,2));const key=new T.DirectionalLight(0xbbdbe8,3);key.position.set(-8,12,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.1,far:80});key.shadow.bias=-.0003;s.add(key);const c=new T.PerspectiveCamera(52,w/h,.1,600);return{s,r,c,w,h};}
const {s,r,c,w,h}=setup(document.querySelector('#scene'));s.fog=new T.FogExp2(0x070d14,.009);
function pad(x,y,z,width,depth,color=glow){const g=new T.Group();s.add(g);g.position.set(x,y,z);box(g,0,-.29,0,width,.58,depth,materials.side);box(g,0,.008,0,width-.20,.025,depth-.20,materials.floor);
 for(const side of[-1,1]){box(g,side*(width/2-.055),.033,0,.045,.034,depth-.1,color);box(g,0,.033,side*(depth/2-.055),width-.1,.034,.045,color);box(g,side*width/2,-.23,0,.018,.02,depth*.60,color);}
 // Fine surface circuitry and a readable center-line heading.
 for(let i=-2;i<=2;i++)box(g,i*width/6,.029,0,.012,.006,depth-.5,new T.MeshStandardMaterial({color:0x223e4a,roughness:.6}));
 for(let z1=-depth/2+.6;z1<depth/2;z1+=1.3){box(g,-.08,.04,z1,.018,.012,.33,color);box(g,.08,.04,z1,.018,.012,.33,color);}
 return g;}
pad(0,0,4,7.6,8);pad(0,1.25,-5,6.3,5.8);pad(-1.8,2.5,-13,5.2,5.6);pad(1.3,3.75,-21,5.5,5.5);pad(0,5,-29,8,7,amber);pad(0,6.25,-39,6,6);pad(-1.6,7.5,-48,5.6,5.5);pad(1.2,8.75,-57,6,6);pad(0,10,-67,9,8,amber);
const player=runner(s);player.position.set(0,.04,4.8);player.rotation.y=.08;
// Checkpoint portal on a broad, stable landing.
for(const z of[-30,-68]){const y=z===-30?5:10;for(const x of[-3.5,3.5]){box(s,x,y+2.3,z,.20,4.6,.26,materials.side);box(s,x,y+2.3,z+.15,.045,4.4,.045,amber);}box(s,0,y+4.55,z,7.2,.20,.26,materials.side);box(s,0,y+4.43,z+.15,7,.045,.045,amber);}
// Telegraph a later obstacle; no busy hazards in the first jump.
box(s,1.3,4.4,-21,4.7,.12,.14,hazard);box(s,1.3,4.1,-21,.2,.65,.2,materials.joint);
const pylons=new T.Group();s.add(pylons);let seed=73;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<38;i++){const side=i%2?1:-1,x=side*(14+rand()*30),z=15-rand()*210,hei=12+rand()*45,y=-14+hei/2;box(pylons,x,y,z,1.7+rand()*5,hei,2.8,materials.side);box(pylons,x-side*.9,y,z+1.5,.025,hei*.7,.025,new T.MeshStandardMaterial({color:0x183d4e,emissive:0x133748,emissiveIntensity:.8}));}
// Rising energy field below the course. Subdued, distinct from the cyan route.
const grid=new T.GridHelper(230,60,0x65352c,0x321c21);grid.position.y=-11;s.add(grid);const voidPlane=mesh(new T.PlaneGeometry(260,260),new T.MeshBasicMaterial({color:0x351a1a,transparent:true,opacity:.38,side:T.DoubleSide}),s,0,-11.1,-40);voidPlane.rotation.x=-Math.PI/2;
const pts=[];for(let i=0;i<500;i++)pts.push((rand()-.5)*260,rand()*100-10,-rand()*280);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));s.add(new T.Points(geo,new T.PointsMaterial({color:0x719aa9,size:.06,transparent:true,opacity:.5})));
c.position.set(0,9,18);c.lookAt(0,0,-8);
const composer=new EffectComposer(r);composer.addPass(new RenderPass(s,c));composer.addPass(new UnrealBloomPass(new T.Vector2(w,h),.28,.5,.9));composer.addPass(new OutputPass());composer.render();
const detail=setup(document.querySelector('#runner'),0x091116);detail.c.position.set(2.9,1.8,4.6);detail.c.lookAt(0,1.15,0);detail.c.fov=34;detail.c.updateProjectionMatrix();runner(detail.s).rotation.y=-.35;detail.r.render(detail.s,detail.c);
window.designReady=true;
