import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x05070c);scene.fog=new THREE.Fog(0x05070c,100,340);
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,700);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;$('game').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xcbd9ef,0x11131b,2));
const moon=new THREE.DirectionalLight(0xdce8ff,2.7);moon.position.set(-20,45,20);scene.add(moon);
const orange=new THREE.PointLight(0xff573b,45,100);orange.position.set(0,10,-35);scene.add(orange);
const blue=new THREE.PointLight(0x42bfff,28,70);blue.position.set(0,9,-105);scene.add(blue);
const mat=(c,r=.45,m=.2,extra={})=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,...extra});
const M={road:mat(0x20242c,.95),ground:mat(0x090c13,.98),white:mat(0xe9edf2,.22,.55),silver:mat(0xaeb9c7,.28,.65),glass:mat(0x101b29,.16,.65),black:mat(0x080a0e,.6,.25),tire:mat(0x08090b,.92),rim:mat(0x687586,.28,.85),metal:mat(0x333c48,.55,.7),orange:mat(0xff6548,.32,.3,{emissive:0x741b0d,emissiveIntensity:1}),red:mat(0xff170d,.25,.2,{emissive:0x990700,emissiveIntensity:2}),lamp:mat(0xffffff,.2,.1,{emissive:0xffcda0,emissiveIntensity:3}),cyan:mat(0x5bdcff,.22,.2,{emissive:0x1689b0,emissiveIntensity:2})};
function mesh(g,m,p=scene,pos=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
function box(p,d,m,pos){return mesh(new THREE.BoxGeometry(...d),m,p,pos)}
const floor=mesh(new THREE.PlaneGeometry(500,500),M.ground,scene,[0,-.35,-70]);floor.rotation.x=-Math.PI/2;
const grid=new THREE.GridHelper(360,90,0x263347,0x131b29);grid.position.set(0,-.32,-70);scene.add(grid);
function road(z,len,w=20){box(scene,[w,.22,len],M.road,[0,-.12,z]);for(const x of [-w/2+.4,w/2-.4])box(scene,[.14,.025,len],M.orange,[x,.01,z]);for(let z1=z-len/2+4;z1<z+len/2;z1+=8)box(scene,[.12,.025,3],M.silver,[0,.015,z1]);}
road(-35,110,20);road(-110,95,22);road(-180,85,22);
for(let z=-12;z>-220;z-=18){for(const x of [-15,15]){box(scene,[.35,5,.35],M.black,[x,2.2,z]);box(scene,[1.8,.15,.3],M.black,[x,4.7,z]);mesh(new THREE.SphereGeometry(.18,8,6),M.lamp,scene,[x,4.58,z]);}}
function createCar(){
 const car=new THREE.Group();scene.add(car);const shell=new THREE.Group();car.add(shell);
 // A low, tapered silver sports-car silhouette with wedge nose and swept canopy.
 const outline=[[-.72,-2.25,.52],[.72,-2.25,.52],[.96,-1.45,.62],[.91,-.35,.64],[.76,.75,.59],[.94,1.48,.54],[.7,2.05,.48],[-.7,2.05,.48],[-.94,1.48,.54],[-.76,.75,.59],[-.91,-.35,.64],[-.96,-1.45,.62]];
 const shape=new THREE.Shape();shape.moveTo(outline[0][0],outline[0][1]);for(let i=1;i<outline.length;i++)shape.lineTo(outline[i][0],outline[i][1]);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.08,bevelThickness:.06});geo.rotateX(Math.PI/2);geo.translate(0,.55,0);
 const body=mesh(geo,M.white,shell,[0,0,0]);body.rotation.y=Math.PI;
 // Hood/deck panels.
 box(shell,[1.5,.07,.98],M.white,[0,.78,-1.42]);
 box(shell,[1.42,.065,.78],M.silver,[0,.77,1.48]);
 // Panoramic black canopy, front and rear sloped glass.
 const canopy=mesh(new THREE.BoxGeometry(1.34,.42,1.48),M.glass,shell,[0,1.02,.05]);canopy.rotation.x=-.12;
 const roof=mesh(new THREE.BoxGeometry(1.18,.075,.7),M.white,shell,[0,1.26,.15]);roof.rotation.x=-.08;
 const wind=mesh(new THREE.BoxGeometry(1.28,.035,.42),M.glass,shell,[0,1.05,-.75]);wind.rotation.x=-.48;
 const rear=mesh(new THREE.BoxGeometry(1.24,.035,.4),M.glass,shell,[0,1.03,.84]);rear.rotation.x=.5;
 box(shell,[1.82,.1,.23],M.black,[0,.43,-2.12]);box(shell,[1.78,.1,.22],M.black,[0,.43,2.08]);
 for(const side of [-1,1]){
  box(shell,[.1,.18,2.65],M.silver,[side*.88,.49,0]);
  box(shell,[.2,.11,.22],M.white,[side*.98,1,-.5]);
  for(const z of [-1.36,1.35]){
   const wheel=new THREE.Group();wheel.position.set(side*.91,.43,z);shell.add(wheel);
   const tire=mesh(new THREE.CylinderGeometry(.39,.39,.23,28),M.tire,wheel);tire.rotation.z=Math.PI/2;
   const rim=mesh(new THREE.CylinderGeometry(.265,.265,.245,24),M.rim,wheel);rim.rotation.z=Math.PI/2;
   const inner=mesh(new THREE.CylinderGeometry(.09,.09,.26,16),M.black,wheel);inner.rotation.z=Math.PI/2;
   for(let k=0;k<5;k++){const spoke=box(wheel,[.035,.22,.045],M.silver,[0,Math.sin(k*Math.PI*2/5)*.13,Math.cos(k*Math.PI*2/5)*.13]);spoke.rotation.x=k*Math.PI*2/5;}
   wheel.userData.wheel=true;
  }
 }
 for(const x of [-.62,.62]){box(shell,[.42,.09,.06],M.lamp,[x,.68,-2.17]);box(shell,[.4,.09,.06],M.red,[x,.7,2.12]);}
 box(shell,[.5,.1,.08],M.black,[0,.5,2.16]);
 // Underbody thruster nozzles: four visible outlets.
 for(const x of [-.48,.48])for(const z of [-.85,.82]){
  const nozzle=mesh(new THREE.CylinderGeometry(.13,.19,.23,12),M.metal,shell,[x,.27,z]);nozzle.rotation.x=Math.PI/2;
  const core=mesh(new THREE.CylinderGeometry(.075,.1,.2,10),M.cyan,shell,[x,.25,z+.02]);core.rotation.x=Math.PI/2;
 }
 car.userData.shell=shell;return car;
}
const car=createCar();car.position.set(0,.02,0);
function makeRamp(z){const g=new THREE.Group();g.position.set(0,0,z);scene.add(g);
 const wedgeGeo=new THREE.BufferGeometry();const v=[-5,0,0,5,0,0,-5,1.8,-12,5,1.8,-12,-5,0,-12,5,0,-12];const ix=[0,1,2,1,3,2,4,2,5,5,2,3,0,2,4,1,5,3];wedgeGeo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));wedgeGeo.setIndex(ix);wedgeGeo.computeVertexNormals();const wedge=mesh(wedgeGeo,M.metal,g);wedge.material.side=THREE.DoubleSide;
 const top=mesh(new THREE.PlaneGeometry(9.4,12),M.orange,g,[0,.94,-6]);top.rotation.x=-Math.atan2(1.8,12);
 for(const x of [-5.05,5.05])box(g,[.18,.28,12],M.cyan,[x,.65,-6]);
 for(let z1=-2;z1>-12;z1-=2)box(g,[8.7,.035,.12],M.white,[0,Math.max(.2,(-z1/12)*1.8),z1]);
 return g;
}
const ramp=makeRamp(-66);
function makeTargetVehicle(x,z,index){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 box(g,[2.05,.52,4.2],M.white,[0,.6,0]);box(g,[1.55,.42,1.7],M.glass,[0,1.03,-.1]);box(g,[1.95,.13,.25],M.black,[0,.4,-2.02]);
 for(const side of [-1,1])for(const zz of [-1.25,1.25]){const w=mesh(new THREE.CylinderGeometry(.34,.34,.2,16),M.tire,g,[side*1.02,.38,zz]);w.rotation.z=Math.PI/2;}
 box(g,[.38,.12,.08],M.red,[-.65,.7,2.12]);box(g,[.38,.12,.08],M.red,[.65,.7,2.12]);
 return g;
}
// Five clearly visible target vehicles are placed across the runway after the launch ramp.
const targets=[];for(let i=0;i<5;i++)targets.push(makeTargetVehicle([-8,-4,0,4,8][i],-112,i));
const launchPad=box(scene,[12,.25,14],M.metal,[0,-.12,-22]);
for(const x of [-5.4,5.4])box(scene,[.18,.08,13],M.cyan,[x,.04,-22]);
const liftPillars=[];
for(const x of [-5.6,5.6])for(const z of [-27,-17]){box(scene,[.22,6,.22],M.metal,[x,2.8,z]);box(scene,[.42,.12,.42],M.cyan,[x,5.8,z]);}
const exhausts=[];
for(const x of [-.48,.48])for(const z of [-.8,.8]){
 const flame=mesh(new THREE.ConeGeometry(.22,2.3,12),new THREE.MeshBasicMaterial({color:0x63dfff,transparent:true,opacity:.86,blending:THREE.AdditiveBlending,depthWrite:false}),car,[x,-1,z]);
 flame.rotation.x=Math.PI;flame.visible=false;exhausts.push(flame);
}
const smokeMat=new THREE.MeshBasicMaterial({color:0xcbd3de,transparent:true,opacity:.24,depthWrite:false});
const particles=[];for(let i=0;i<75;i++){const p=mesh(new THREE.SphereGeometry(1,7,6),smokeMat,scene,[0,-200,0]);p.visible=false;particles.push({mesh:p,life:0,vel:new THREE.Vector3()});}
let particleCursor=0;
function emitSmoke(power=1){for(let n=0;n<3;n++){const p=particles[particleCursor++%particles.length];p.mesh.position.copy(car.position).add(new THREE.Vector3((Math.random()-.5)*1.1,-.3,(Math.random()-.5)*1.5));p.mesh.position.y=Math.max(.1,p.mesh.position.y);p.mesh.scale.setScalar(.25+Math.random()*.35);p.life=.65+Math.random()*.6;p.vel.set((Math.random()-.5)*1.2,1+Math.random()*2,(Math.random()-.5)*1.3);p.mesh.visible=true;}}
const input={};let mode=0,started=false,paused=false,speed=0,vertical=0,airborne=false,flightTime=0,score=0,passed=0,landed=false,camMode=0;
const camNames=['CHASE CAM','SIDE CAM','FRONT CAM','TOP CAM'];
function setMode(n){mode=n;started=false;paused=false;speed=0;vertical=0;airborne=false;flightTime=0;score=0;passed=0;landed=false;car.position.set(0,.02,0);car.rotation.set(0,Math.PI,0);car.userData.shell.rotation.set(0,0,0);
 $('modeLabel').textContent=n===1?'TEST 01 · VERTICAL THRUST':'TEST 02 · FIVE-CAR JUMP';
 $('message').classList.remove('hidden');
 $('message').innerHTML=n===1?'<span>DEMONSTRATION 01</span><strong>VERTICAL THRUST</strong><small>HOLD LIFT TO FIRE THE THRUSTERS</small>':'<span>DEMONSTRATION 02</span><strong>JUMP FIVE VEHICLES</strong><small>BUILD SPEED, THEN TAP JUMP ON THE RAMP</small>';
 $('start').textContent='START TEST';$('pause').textContent='PAUSE';$('score').textContent='000000';$('passed').textContent='0 / 5';
 exhausts.forEach(e=>e.visible=false);
}
function begin(){started=true;paused=false;$('message').classList.add('hidden');$('start').textContent='TEST RUNNING';}
function reset(){setMode(mode||1);}
function hold(id,key){const b=$(id);if(!b)return;b.addEventListener('pointerdown',e=>{e.preventDefault();input[key]=true;b.setPointerCapture?.(e.pointerId);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>input[key]=false);}
for(const k of ['left','right','gas','brake','lift','jump'])hold(k,k);
addEventListener('keydown',e=>{const k=e.key.toLowerCase();input[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='c'){camMode=(camMode+1)%4;$('cameraName').textContent=camNames[camMode];}if(k==='r')setMode(mode);if(k==='p'||k==='escape')togglePause();});
addEventListener('keyup',e=>input[e.key.toLowerCase()]=false);
$('test1').addEventListener('click',()=>setMode(1));$('test2').addEventListener('click',()=>setMode(2));
$('start').addEventListener('click',()=>started?null:begin());
$('pause').addEventListener('click',togglePause);$('reset').addEventListener('click',()=>setMode(mode));
$('camera').addEventListener('click',()=>{camMode=(camMode+1)%4;$('cameraName').textContent=camNames[camMode];});
function togglePause(){if(!started)return;paused=!paused;$('pause').textContent=paused?'RESUME':'PAUSE';if(paused){$('message').classList.remove('hidden');$('message').innerHTML='<span>PAUSED</span><strong>TEST ON HOLD</strong><small>TAP RESUME TO CONTINUE</small>';}else $('message').classList.add('hidden');}
function update(dt){
 const gas=input.gas||input.w||input.arrowup,brake=input.brake||input.s||input.arrowdown,steer=(input.right||input.d||input.arrowright?1:0)-(input.left||input.a||input.arrowleft?1:0),lift=input.lift||input[' '],jump=input.jump;
 exhausts.forEach((e,i)=>{e.visible=mode===1&&started&&!paused&&lift;e.scale.set(1,.65+Math.random()*1.1,1);e.material.opacity=.55+Math.random()*.4;});
 if(!started||paused)return;
 if(mode===1){
   // Test 1 is a straight vertical demonstration: no sideways flight, four thrusters and exhaust smoke.
   speed=gas?Math.min(speed+dt*14,24):Math.max(0,speed-dt*8);
   if(lift){vertical=Math.min(vertical+dt*7,25);emitSmoke(1);}
   else vertical=Math.max(0,vertical-dt*8);
   car.position.y=.02+vertical;
   car.position.z-=speed*dt*.12;
   car.rotation.y=Math.PI;
   if(vertical>1){$('message').classList.remove('hidden');$('message').innerHTML='<span>THRUSTERS ACTIVE</span><strong>VERTICAL LIFT</strong><small>BLUE GAS PLUMES · CONTROLLED ASCENT</small>';}
   else if(!lift)$('message').classList.add('hidden');
   $('score').textContent=String(Math.round(vertical*100)).padStart(6,'0');
 }else{
   speed=gas?Math.min(speed+dt*22,50):Math.max(0,speed-dt*4);
   if(brake)speed=Math.max(0,speed-dt*25);
   car.position.x+=steer*speed*dt*.42;car.position.x=THREE.MathUtils.clamp(car.position.x,-8.7,8.7);
   car.position.z-=speed*dt*.8;
   // Ramp triggers only at its physical approach; jump button can trigger a manual launch too.
   if(!airborne&&car.position.z<-55&&car.position.z>-70&&speed>8){
     airborne=true;vertical=10+speed*.16;flightTime=0;car.position.y=1;emitSmoke(1);
     $('message').classList.remove('hidden');$('message').innerHTML='<span>RAMP LAUNCH</span><strong>BIG AIR</strong><small>CLEAR ALL FIVE VEHICLES</small>';
   }
   if(jump&&!airborne&&speed>5&&car.position.z<-48&&car.position.z>-72){airborne=true;vertical=12+speed*.15;flightTime=0;}
   if(airborne){flightTime+=dt;vertical-=dt*9.8;car.position.y+=vertical*dt;emitSmoke(.6);
     // Count each vehicle as the car passes it while safely above its roof.
     for(let i=0;i<targets.length;i++){if(!targets[i].userData.passed&&car.position.z<targets[i].position.z&&car.position.y>2.3){targets[i].userData.passed=true;passed++;score+=1000;$('passed').textContent=passed+' / 5';}}
     if(car.position.y<=.02&&vertical<0){car.position.y=.02;vertical=0;airborne=false;landed=true;
       if(passed===5){$('message').classList.remove('hidden');$('message').innerHTML='<span>TEST COMPLETE</span><strong>ALL FIVE CLEARED</strong><small>PERFECT LANDING</small>';}
       else{$('message').classList.remove('hidden');$('message').innerHTML='<span>TEST RESULT</span><strong>'+passed+' / 5 CLEARED</strong><small>RESET TO TRY AGAIN</small>';}
     }
   }
   car.rotation.z=THREE.MathUtils.lerp(car.rotation.z,-steer*.045,dt*4);
   $('score').textContent=String(score).padStart(6,'0');
 }
 $('speed').textContent=String(Math.round(speed*3.6)).padStart(3,'0');
}
const clock=new THREE.Clock(),camPos=new THREE.Vector3(),look=new THREE.Vector3();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.033);update(dt);
 const fwd=new THREE.Vector3(0,0,-1);
 if(camMode===0){camPos.set(car.position.x,car.position.y+5.2,car.position.z+11);look.set(car.position.x,car.position.y+1.1,car.position.z-5);}
 else if(camMode===1){camPos.set(car.position.x+10,car.position.y+3,car.position.z+1);look.copy(car.position);}
 else if(camMode===2){camPos.set(car.position.x,car.position.y+2.3,car.position.z-7);look.set(car.position.x,car.position.y+1,car.position.z-15);}
 else{camPos.set(car.position.x,car.position.y+27,car.position.z+2);look.copy(car.position);}
 camera.position.lerp(camPos,1-Math.exp(-dt*4));camera.lookAt(look);
 for(const p of particles){if(!p.mesh.visible)continue;p.life-=dt;p.mesh.position.addScaledVector(p.vel,dt);p.mesh.scale.multiplyScalar(1+dt*.55);p.mesh.material.opacity=Math.max(0,p.life*.2);if(p.life<=0){p.mesh.visible=false;p.mesh.position.y=-200;}}
 renderer.render(scene,camera);
}
setMode(1);requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));});
window.addEventListener('load',()=>setTimeout(()=>$('loading').classList.add('done'),400));setTimeout(()=>$('loading').classList.add('done'),1800);
