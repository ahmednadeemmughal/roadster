import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b12);
scene.fog = new THREE.FogExp2(0x080b12, 0.0032);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 900);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
$('game').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xbacbe5, 0x171922, 1.65));
const moon = new THREE.DirectionalLight(0xd7e5ff, 2.3);
moon.position.set(-35, 65, 25); moon.castShadow = true;
moon.shadow.mapSize.set(1024,1024);
moon.shadow.camera.left = -75; moon.shadow.camera.right = 75;
moon.shadow.camera.top = 75; moon.shadow.camera.bottom = -75;
scene.add(moon);
const orangeGlow = new THREE.PointLight(0xff5538, 24, 50);
orangeGlow.position.set(-22, 8, 8); scene.add(orangeGlow);
const blueGlow = new THREE.PointLight(0x4e7eff, 20, 45);
blueGlow.position.set(24, 7, -22); scene.add(blueGlow);

const material = (color, roughness=.55, metalness=.15, extra={}) => new THREE.MeshStandardMaterial({color, roughness, metalness, ...extra});
const mats = {
  asphalt: material(0x20242c,.94), edge: material(0xff6549,.55,.15),
  stripe: material(0xc9d0da,.6), barrier: material(0x343b48,.7,.35),
  dark: material(0x080b11,.42,.2), rubber: material(0x090b0e,.94),
  rim: material(0x9ca9b9,.25,.85), glass: material(0x132638,.18,.6,{metalness:.45}),
  body: material(0xe7ebf1,.24,.52), bodyDark: material(0x9eaab8,.3,.55),
  light: material(0xffe7c2,.22,.1,{emissive:0xffa85c,emissiveIntensity:2.8}),
  tail: material(0xff271e,.22,.1,{emissive:0xff160d,emissiveIntensity:2.2})
};
function mesh(geo, mat, parent=scene, pos=[0,0,0]) {
  const o = new THREE.Mesh(geo,mat); o.position.set(...pos); o.castShadow=true; o.receiveShadow=true; parent.add(o); return o;
}
function box(parent, dims, mat, pos) { return mesh(new THREE.BoxGeometry(...dims),mat,parent,pos); }

const ground = mesh(new THREE.PlaneGeometry(700,700), material(0x0b0e15,.98), scene, [0,-.55,0]);
ground.rotation.x=-Math.PI/2;
const grid = new THREE.GridHelper(360,90,0x2c3749,0x151d2a);
grid.position.y=-.5; scene.add(grid);

// Closed circuit with wide, smooth bends; road and markings are generated from one centerline.
const control = [
  [-42,28],[-24,34],[0,34],[24,31],[39,22],[44,7],[43,-10],[34,-26],
  [17,-33],[-8,-33],[-30,-29],[-43,-17],[-47,0]
].map(([x,z])=>new THREE.Vector3(x,0,z));
const path = new THREE.CatmullRomCurve3(control,true,'centripetal',.25);
const samples=480, roadWidth=14;
const center=path.getSpacedPoints(samples);
function edgePoint(i,side,offset=0){
  const p=center[(i%samples+samples)%samples], tangent=path.getTangentAt(i/samples);
  const n=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
  return p.clone().addScaledVector(n,side*(roadWidth/2+offset));
}
function ribbon(width, y, mat, offset=0){
  const verts=[], indices=[];
  for(let i=0;i<=samples;i++){
    const p=center[i%samples], t=path.getTangentAt(i/samples), n=new THREE.Vector3(-t.z,0,t.x).normalize();
    const half=width/2;
    verts.push(p.x+n.x*(half+offset),y,p.z+n.z*(half+offset),p.x-n.x*(half+offset),y,p.z-n.z*(half+offset));
    if(i<samples){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();
  const o=new THREE.Mesh(g,mat);o.receiveShadow=true;scene.add(o);return o;
}
ribbon(roadWidth+2,.005,mats.edge);
ribbon(roadWidth,.025,mats.asphalt);
ribbon(roadWidth-1.1,.035,material(0x252a33,.98));
for(let i=0;i<samples;i+=4){
  const p=center[i],t=path.getTangentAt(i/samples),n=new THREE.Vector3(-t.z,0,t.x).normalize();
  for(const side of [-1,1]){
    const stripe=mesh(new THREE.BoxGeometry(.12,.025,1.2),mats.stripe,scene,[p.x+n.x*side*5.6,.06,p.z+n.z*side*5.6]);
    stripe.rotation.y=Math.atan2(t.x,t.z);
  }
}
// segmented outer safety barriers and occasional orange track lamps
for(let i=0;i<samples;i+=4){
  for(const side of [-1,1]){
    const p=edgePoint(i,side,1.25), t=path.getTangentAt(i/samples);
    const rail=mesh(new THREE.BoxGeometry(1.05,.55,.24),mats.barrier,scene,[p.x,.38,p.z]);
    rail.rotation.y=Math.atan2(t.x,t.z);
    if(i%24===0){
      const post=mesh(new THREE.CylinderGeometry(.055,.075,1.15,8),mats.dark,scene,[p.x,.6,p.z]);
      const lamp=mesh(new THREE.BoxGeometry(.12,.08,.3),mats.edge,scene,[p.x,1.12,p.z]);
      lamp.material=material(0xff583e,.25,.15,{emissive:0xff321c,emissiveIntensity:2.5});
    }
  }
}
// Tall sparse light poles outside the circuit create scale and reflections.
for(let i=0;i<samples;i+=40){
  const p=edgePoint(i,(i%80===0)?1:-1,5);
  const pole=mesh(new THREE.CylinderGeometry(.08,.12,7,8),mats.dark,scene,[p.x,3.5,p.z]);
  mesh(new THREE.BoxGeometry(.9,.12,.18),mats.dark,scene,[p.x,7,p.z]);
  const bulb=mesh(new THREE.SphereGeometry(.16,10,8),mats.light,scene,[p.x,6.88,p.z]);
}

// Detailed stylized roadster model, with shaped fenders, hood, cabin, glass and lighting.
const car=new THREE.Group();scene.add(car);
const chassis=new THREE.Group();car.add(chassis);
// Low, tapered body shell built as a loft rather than a single rectangular block.
function makeBody(){
  const stations=[
    {z:-2.18,w:.64,b:.48,t:.65,roof:.58},
    {z:-1.82,w:.88,b:.47,t:.78,roof:.82},
    {z:-1.20,w:.96,b:.46,t:.86,roof:.94},
    {z:-.45,w:.91,b:.46,t:.80,roof:.89},
    {z:.55,w:.83,b:.46,t:.78,roof:.83},
    {z:1.35,w:.94,b:.46,t:.75,roof:.88},
    {z:1.92,w:.88,b:.47,t:.66,roof:.79},
    {z:2.16,w:.69,b:.49,t:.60,roof:.62}
  ];
  const vertices=[],indices=[];
  for(const s of stations){
    vertices.push(-s.w,s.b,s.z, s.w,s.b,s.z, s.roof,s.t,s.z, -s.roof,s.t,s.z);
  }
  for(let i=0;i<stations.length-1;i++){
    const a=i*4,b=a+4;
    for(let j=0;j<4;j++){const k=(j+1)%4;indices.push(a+j,a+k,b+j,a+k,b+k,b+j);}
  }
  indices.push(0,1,2,0,2,3);
  const last=(stations.length-1)*4;indices.push(last,last+2,last+1,last,last+3,last+2);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
  const body=mesh(g,mats.body,chassis);body.material.side=THREE.DoubleSide;
}
makeBody();
// Separate sculpted hood, rear deck and dark lower aero lip add recognisable sports-car proportions.
box(chassis,[1.48,.07,1.05],mats.body,[0,.86,-1.36]);
box(chassis,[1.47,.07,.7],mats.bodyDark,[0,.79,1.55]);
box(chassis,[1.82,.09,.30],mats.dark,[0,.45,-2.12]);
box(chassis,[1.78,.10,.25],mats.dark,[0,.45,2.13]);
box(chassis,[1.38,.10,.10],mats.bodyDark,[0,1.43,.82]);
box(chassis,[.08,.04,.52],mats.dark,[-.55,1.47,.82]);
box(chassis,[.08,.04,.52],mats.dark,[.55,1.47,.82]);
box(chassis,[1.68,.09,.16],mats.dark,[0,1.43,.84]);
box(chassis,[1.52,.06,.13],mats.bodyDark,[0,1.36,.84]);
box(chassis,[1.5,.06,.1],mats.dark,[0,1.32,-.89]);
for(const x of [-.38,.38]){
  box(chassis,[.32,.025,.55],mats.bodyDark,[x,.91,-1.43]);
  box(chassis,[.035,.025,.55],mats.stripe,[x,.93,-1.43]);
}

// Hood sculpting, side skirts, front splitter and rear diffuser.
box(chassis,[1.52,.07,1.0],mats.body,[0,.98,-1.42]);
box(chassis,[2.02,.09,.42],mats.dark,[0,.47,-2.12]);
box(chassis,[1.86,.1,.3],mats.bodyDark,[0,.48,2.12]);
for(const side of [-1,1]){
  box(chassis,[.13,.2,2.8],mats.bodyDark,[side*.91,.51,0]);
  // mirrors
  box(chassis,[.2,.12,.25],mats.body,[side*1.0,1.03,-.48]);
  // wheel arches visually frame each wheel
  for(const z of [-1.38,1.38]){
    const arch=mesh(new THREE.TorusGeometry(.49,.085,8,24,Math.PI),mats.body,chassis,[side*.88,.48,z]);
    arch.rotation.z=Math.PI;
    arch.rotation.x=Math.PI/2;
  }
}
// Windshield and rear glass, placed as tilted panes.
const windshield=mesh(new THREE.BoxGeometry(1.42,.035,.56),mats.glass,chassis,[0,1.22,-.48]);windshield.rotation.x=-.55;
const rearGlass=mesh(new THREE.BoxGeometry(1.35,.035,.45),mats.glass,chassis,[0,1.2,.57]);rearGlass.rotation.x=.55;
const wheels=[];
for(const x of [-.96,.96])for(const z of [-1.38,1.38]){
  const pivot=new THREE.Group();pivot.position.set(x,.43,z);chassis.add(pivot);wheels.push({pivot,front:z<0});
  const tire=mesh(new THREE.CylinderGeometry(.39,.39,.25,24),mats.rubber,pivot,[0,0,0]);tire.rotation.z=Math.PI/2;
  const rim=mesh(new THREE.CylinderGeometry(.255,.255,.265,20),mats.rim,pivot,[0,0,0]);rim.rotation.z=Math.PI/2;
  const hub=mesh(new THREE.CylinderGeometry(.09,.09,.28,16),mats.dark,pivot,[0,0,0]);hub.rotation.z=Math.PI/2;
  for(let k=0;k<5;k++){const a=k*Math.PI*2/5;const spoke=mesh(new THREE.BoxGeometry(.035,.19,.035),mats.stripe,pivot,[0,Math.sin(a)*.15,Math.cos(a)*.15]);spoke.rotation.x=a;}
}
for(const x of [-.66,.66]){
  const head=mesh(new THREE.BoxGeometry(.42,.12,.08),mats.light,chassis,[x,.76,-2.17]);
  const tail=mesh(new THREE.BoxGeometry(.42,.12,.08),mats.tail,chassis,[x,.78,2.17]);
}
box(chassis,[.5,.12,.08],mats.dark,[0,.49,2.18]);
// A subtle shadow pad helps the vehicle read against the road.
const shadow=mesh(new THREE.CircleGeometry(1.45,32),new THREE.MeshBasicMaterial({color:0x03050a,transparent:true,opacity:.45,depthWrite:false}),car,[0,.025,0]);shadow.rotation.x=-Math.PI/2;shadow.scale.set(1,1.65,1);

// Smoke particles: pooled lightweight sprites, emitted only during a fast handbrake slide.
const smokeMat=new THREE.MeshBasicMaterial({color:0xbfc7d2,transparent:true,opacity:.22,depthWrite:false});
const smoke=[];
for(let i=0;i<36;i++){
  const s=mesh(new THREE.SphereGeometry(1,7,6),smokeMat,scene,[0,-100,0]);s.visible=false;smoke.push({mesh:s,life:0,vel:new THREE.Vector3(),size:.5});
}
let smokeCursor=0;
function puff(){
  const item=smoke[smokeCursor++%smoke.length], rear=new THREE.Vector3(0,.32,1.55).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);
  item.mesh.position.copy(car.position).add(rear);item.mesh.position.y=.25;
  item.vel.set((Math.random()-.5)*1.6,.5+Math.random()*.65,(Math.random()-.5)*1.6);
  item.life=.8+Math.random()*.5;item.size=.35+Math.random()*.35;item.mesh.scale.setScalar(item.size);item.mesh.visible=true;
}

// Keep distant scenery low and well outside the driving area so it never blocks the chase camera.
const skylineMat=material(0x101722,.95,.05);
for(let i=0;i<54;i++){
  const a=Math.PI*2*i/54, r=150+(i%4)*7, h=2.5+(i%7)*.7, w=3+(i%3);
  mesh(new THREE.BoxGeometry(w,h,w),skylineMat,scene,[Math.cos(a)*r,h/2-.3,Math.sin(a)*r]);
}

let speed=0,heading=0,driftAngle=0,score=0,started=false,paused=false,cam=0,elapsed=0;
const keys={},touch={};
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();keys[k]=true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  if(k==='c')setCam((cam+1)%5);if(k==='r')reset();
  if(k==='escape'||k==='p')togglePause();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function bindHold(id,key){
  const b=$(id);if(!b)return;
  b.addEventListener('pointerdown',e=>{e.preventDefault();touch[key]=true;b.setPointerCapture?.(e.pointerId);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>touch[key]=false));
}
['left','right','gas','brake','handbrake'].forEach(k=>bindHold(k,k));
function down(...list){return list.some(k=>keys[k]||touch[k]);}
function setCam(n){
  cam=n;
  $('cameraName').textContent=['CHASE CAM','HOOD CAM','COCKPIT CAM','OVERHEAD CAM','SIDE CAM'][n];
  document.querySelectorAll('[data-cam]').forEach(b=>b.classList.toggle('active',Number(b.dataset.cam)===n));
}
document.querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(Number(b.dataset.cam))));
function reset(){
  const p=path.getPointAt(.12);const t=path.getTangentAt(.12);
  car.position.set(p.x,.04,p.z);heading=Math.atan2(-t.x,-t.z);car.rotation.y=heading;
  speed=0;driftAngle=0;score=0;paused=false;
  $('score').textContent='000000';$('angle').textContent='00°';$('gear').textContent='N';
  $('pause').textContent='PAUSE';$('message').classList.remove('hidden');
}
function togglePause(){
  if(!started)return;
  paused=!paused;$('pause').textContent=paused?'RESUME':'PAUSE';
  if(paused)$('message').classList.remove('hidden');else $('message').classList.add('hidden');
}
$('reset').addEventListener('click',reset);
$('pause').addEventListener('click',togglePause);
$('start').addEventListener('click',()=>{
  started=true;paused=false;$('start').innerHTML='<span class="button-dot"></span> ENGINE ON';
  $('pause').textContent='PAUSE';$('message').classList.add('hidden');
});
reset();
const cameraTarget=new THREE.Vector3(),cameraPosition=new THREE.Vector3();
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.035);elapsed+=dt;
  const gas=down('w','arrowup','gas'),brake=down('s','arrowdown','brake'),hand=down(' ','handbrake');
  const steer=(down('d','arrowright','right')?1:0)-(down('a','arrowleft','left')?1:0);
  if(started&&!paused){
    speed+=gas?19*dt:-2.5*dt;
    if(brake)speed-=24*dt;
    if(hand)speed*=Math.max(0,1-.16*dt);
    speed=THREE.MathUtils.clamp(speed,-10,58);
    const speedFactor=Math.min(Math.abs(speed)/15,1);
    heading+=steer*speedFactor*dt*(speed>=0?1:-1)*(hand?1.25:.78);
    const desiredDrift=steer*(hand?-.72:-.18)*speedFactor;
    driftAngle=THREE.MathUtils.lerp(driftAngle,desiredDrift,1-Math.exp(-dt*(hand?4:2)));
    const moveAngle=heading+driftAngle;
    car.position.x+=-Math.sin(moveAngle)*speed*dt;
    car.position.z+=-Math.cos(moveAngle)*speed*dt;
    car.rotation.y=heading;
    car.rotation.z=THREE.MathUtils.lerp(car.rotation.z,-steer*speedFactor*.045,dt*4);
    wheels.forEach(w=>{
      w.pivot.rotation.x+=speed*dt*1.8;
      if(w.front)w.pivot.rotation.y=steer*.36;
    });
    if(hand&&Math.abs(speed)>8&&Math.abs(steer)>.1){
      puff();score+=Math.abs(speed)*Math.abs(steer)*dt*14;
    }
    $('score').textContent=Math.floor(score).toString().padStart(6,'0');
    $('gear').textContent=speed < -1?'R':speed > 1?String(Math.min(6,Math.floor(speed/8)+1)):'N';
    if(Math.abs(speed)>2)$('message').classList.add('hidden');
  }
  for(const p of smoke){
    if(p.mesh.visible){
      p.life-=dt;p.mesh.position.addScaledVector(p.vel,dt);p.mesh.scale.addScalar(dt*.48);
      p.mesh.material=smokeMat; if(p.life<=0){p.mesh.visible=false;p.mesh.position.y=-100;}
    }
  }
  const forward=new THREE.Vector3(-Math.sin(heading),0,-Math.cos(heading));
  const up=new THREE.Vector3(0,1,0);
  if(cam===0){
    cameraPosition.copy(car.position).addScaledVector(forward,-9.5).add(new THREE.Vector3(0,4.2,0));
    cameraTarget.copy(car.position).addScaledVector(forward,3.2).add(new THREE.Vector3(0,1,0));
  }else if(cam===1){
    cameraPosition.copy(car.position).addScaledVector(forward,-1.0).add(new THREE.Vector3(0,1.45,0));
    cameraTarget.copy(car.position).addScaledVector(forward,18).add(new THREE.Vector3(0,.8,0));
  }else if(cam===2){
    cameraPosition.copy(car.position).addScaledVector(forward,-.05).add(new THREE.Vector3(0,1.23,0));
    cameraTarget.copy(car.position).addScaledVector(forward,15).add(new THREE.Vector3(0,.9,0));
  }else if(cam===3){
    cameraPosition.copy(car.position).add(new THREE.Vector3(0,24,0));
    cameraTarget.copy(car.position).add(new THREE.Vector3(0,0,-.1));
  }else{
    cameraPosition.copy(car.position).add(new THREE.Vector3(8,3.1,5).applyAxisAngle(up,heading));
    cameraTarget.copy(car.position).add(new THREE.Vector3(0,1,0));
  }
  camera.position.lerp(cameraPosition,1-Math.exp(-dt*(cam===1||cam===2?12:4.5)));
  camera.lookAt(cameraTarget);
  camera.fov=58+Math.min(Math.abs(speed)*.16,7);camera.updateProjectionMatrix();
  const kmh=Math.round(Math.abs(speed)*3.1);
  $('speed').textContent=String(kmh).padStart(3,'0');
  $('speedLine').style.width=Math.min(100,kmh/1.8)+'%';
  $('angle').textContent=String(Math.round(Math.abs(driftAngle)*57.3)).padStart(2,'0')+'°';
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
});
window.addEventListener('load',()=>setTimeout(()=>$('loading').classList.add('done'),350));
setTimeout(()=>$('loading').classList.add('done'),2200);
