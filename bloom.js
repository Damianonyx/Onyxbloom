'use strict';
(()=>{
const canvas=document.getElementById('flower'),stage=document.getElementById('stage'),range=document.getElementById('bloom'),out=document.getElementById('percentage'),pause=document.getElementById('pause'),pauseLabel=document.getElementById('pause-label'),icon=document.getElementById('pause-icon'),video=document.getElementById('fallback');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let running=!reduced,progress=reduced?.85:.12,phase=progress*17,rotation=.25,targetRotation=.25,tilt=.1,targetTilt=.1,last=0,motionTime=0,dragging=false,px=0,py=0;
function updateUI(){range.value=Math.round(progress*100);out.value=range.value+'%';pauseLabel.textContent=running?'Pause':'Play';pause.setAttribute('aria-label',running?'Pause animation':'Play animation');icon.innerHTML=running?'<path d="M4 3h3v10H4zm5 0h3v10H9z"/>':'<path d="m5 3 8 5-8 5z"/>';}
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
let fallback=false;
function useFallback(){fallback=true;canvas.hidden=true;canvas.style.display='none';video.hidden=false;video.currentTime=progress*10;document.querySelector('.interaction-hint').style.display='none';if(running)video.play().catch(()=>{running=false;updateUI()});}
if(!gl)useFallback();
let program,count,uniforms;
if(gl){
const vs=`precision highp float;
attribute vec4 a;attribute vec2 b;
uniform float bloom,rotation,tilt,aspect,dpr,time;
varying float light;
void main(){
float u=a.x,v=a.y,ang=a.z,layer=a.w;vec3 p;
if(layer<0.0){
float y=mix(-2.65,0.58,u);float rad=.045+.008*sin(u*15.0);p=vec3(rad*cos(ang)+.045*sin(u*3.3),y,rad*sin(ang));light=.36+.3*(cos(ang)*.5+.5);
}else{
float opening=smoothstep(layer*.045, .78+layer*.03,bloom);
float len=2.05-layer*.225;
float theta=mix(.12+layer*.018,1.65-layer*.225,opening);
float radial=.08+layer*.009+len*sin(theta)*u;
float width=pow(max(0.0,sin(3.14159265*u)),.68)*(.71-layer*.063)*(0.32+.68*opening)*v;
float cup=(v*v)*(.17+.22*opening)*sin(3.14159265*u);
float y=.45+layer*.073+len*cos(theta)*u+.36*sin(3.14159265*u)-cup+.22*pow(u,7.0)*opening;
radial-=.15*pow(u,5.0)*opening;
p=vec3(radial*cos(ang)-width*sin(ang),y,radial*sin(ang)+width*cos(ang));
p+=vec3(sin(b.x*331.0),cos(b.x*263.0),sin(b.x*487.0))*.009;
light=(.32+.58*b.y)*(.65+.35*abs(v))*(.9+.1*sin(u*80.0+v*9.0));
}
float sway=sin(time*.3)*.018;p.x+=sway*(p.y+2.65);
float c=cos(rotation),s=sin(rotation);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
float tx=.27+tilt;c=cos(tx);s=sin(tx);p=vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
float depth=7.8-p.z;float scale=2.65;
gl_Position=vec4(p.x*scale/aspect,p.y*scale,0.0,depth);
gl_PointSize=clamp(dpr*(.70+b.y*.60)*7.0/depth,.6,3.4);
light*=.72+.28*clamp((p.z+2.0)/4.0,0.0,1.0);
}`;
const fs=`precision mediump float;varying float light;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float alpha=(1.0-smoothstep(.18,.5,d))*light;gl_FragColor=vec4(vec3(.92,.91,.88),alpha);}`;
function shader(type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh;}
try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader link failed');gl.useProgram(program);
let seed=4312;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};const data=[];
for(let layer=0;layer<6;layer++){const petals=[8,7,6,5,4,3][layer];for(let j=0;j<petals;j++){const angle=j*Math.PI*2/petals+layer*1.71;for(let k=0;k<1500;k++){let u=random(),v=random()*2-1;data.push(u,v,angle,layer,random(),random());}}}
for(let i=0;i<5000;i++)data.push(random(),0,random()*Math.PI*2,-1,random(),random());
count=data.length/6;const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);for(const [name,size,offset]of[['a',4,0],['b',2,16]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,24,offset);}uniforms={};for(const key of['bloom','rotation','tilt','aspect','dpr','time'])uniforms[key]=gl.getUniformLocation(program,key);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(25/255,25/255,25/255,1);
}catch(e){console.error(e);useFallback();}
}
function resize(){if(!gl||fallback)return;const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(uniforms.aspect,r.width/r.height);gl.uniform1f(uniforms.dpr,dpr);}
new ResizeObserver(resize).observe(stage);resize();
function frame(now){const dt=Math.min((now-last)/1000||0,.05);last=now;if(!document.hidden){if(running&&!fallback){phase+=dt;motionTime+=dt;const cycle=phase%36;progress=cycle<17?cycle/17:cycle<23?1:cycle<34?1-(cycle-23)/11:0;targetRotation+=dt*.055;}
rotation+=(targetRotation-rotation)*.055;tilt+=(targetTilt-tilt)*.055;
if(gl&&!fallback){gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uniforms.bloom,progress);gl.uniform1f(uniforms.rotation,rotation);gl.uniform1f(uniforms.tilt,tilt);gl.uniform1f(uniforms.time,motionTime);gl.drawArrays(gl.POINTS,0,count);}
if(running){range.value=Math.round(progress*100);out.value=range.value+'%';}}
requestAnimationFrame(frame);}
pause.onclick=()=>{running=!running;if(fallback){if(running)video.play().catch(()=>{running=false;updateUI()});else video.pause();}updateUI();};
document.getElementById('replay').onclick=()=>{phase=0;progress=0;running=true;if(fallback){video.currentTime=0;video.play().catch(()=>{running=false;updateUI()});}updateUI();};
range.oninput=()=>{progress=Number(range.value)/100;phase=progress*17;running=false;if(fallback){video.pause();video.currentTime=progress*10.8;}updateUI();};
video.ontimeupdate=()=>{if(fallback&&running){progress=video.currentTime/10.93;range.value=Math.round(progress*100);out.value=range.value+'%';}};
stage.addEventListener('pointerdown',e=>{if(fallback)return;dragging=true;px=e.clientX;py=e.clientY;stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!dragging)return;targetRotation+=(e.clientX-px)*.008;targetTilt=Math.max(-.35,Math.min(.55,targetTilt+(e.clientY-py)*.003));px=e.clientX;py=e.clientY;});
for(const type of['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,()=>{dragging=false;});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!fallback)useFallback();});
updateUI();requestAnimationFrame(frame);
})();
