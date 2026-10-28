(()=>{
'use strict';
const g=window.SMASH;if(!g)throw Error('Game must be ready before camera adapter');
if(!g.arenaView||g.arenaView.framing?.mode==='launcher')return;
const T={Vector3:g.camera.position.constructor},RAD=Math.PI/180,DISC={originY:.756/2*.64+.025},COURSE={deck:.025};
function launcherFraming(base,prior,d,aspect,points,discScale=.939){
 const tan0=Math.tan(base.fov*RAD/2),s0=Math.sin(base.pitch),c0=Math.cos(base.pitch);
 const oldDepth=(DISC.originY-base.position.y)*s0-(d.spawn-base.position.z)*c0;
 const originalK=oldDepth*tan0,K=originalK*discScale,discY=-.925,U=discY*K;
 const envelope=new Map();for(const p of points){const r=Math.hypot(p.x,p.z);envelope.set(p.y,Math.max(envelope.get(p.y)||0,r));}
 const rail=[];for(const z of [d.railStart,d.radius,d.targetBoundary,d.spawn,d.railRear])for(const side of [-1,1])for(const y of [-.3,.66])rail.push({x:side*(d.railInner+d.railWidth)-d.sourceX,y,z});
 const project=(f,p)=>{const sn=Math.sin(f.pitch),cs=Math.cos(f.pitch),dy=p.y-f.position.y,dz=p.z-f.position.z,dep=dy*sn-dz*cs;return {x:(p.x-f.position.x)/(dep*f.tangent*aspect),y:(dy*cs+dz*sn)/(dep*f.tangent)};};
 const bound=(f,y,r)=>{const sn=Math.sin(f.pitch),cs=Math.cos(f.pitch),dep=(y-f.position.y)*sn+f.position.z*cs;const a=project(f,{x:0,y,z:-r}).y,b=project(f,{x:0,y,z:r}).y;return{x:(r+Math.abs(f.position.x))/(Math.sqrt(Math.max(.001,dep*dep-r*r*cs*cs))*f.tangent*aspect),top:Math.max(a,b),bottom:Math.min(a,b)};};
 let best=null,score=-Infinity;
 // A genuine perspective camera keeps rendering, target picking and aim rays
 // in one coordinate system. No object, collider, or projected mesh is warped.
 for(const z of [80,120,160,240,320,480,640,960,1440])for(let deg=7;deg<=36;deg+=.25){
  const pitch=-deg*RAD,sn=Math.sin(pitch),cs=Math.cos(pitch),y=DISC.originY-(U+(z-d.spawn)*sn)/cs;
  const dep=U*Math.tan(pitch)+(z-d.spawn)/cs,tangent=K/dep,f={position:new T.Vector3(base.position.x,y,z),pitch,tangent,fov:2*Math.atan(tangent)/RAD};
  const board=bound(f,COURSE.deck,d.radius+.18);let railX=0,railBottom=Infinity;
  for(const p of rail){const q=project(f,p);railX=Math.max(railX,Math.abs(q.x));railBottom=Math.min(railBottom,q.y);}
  const rearFloorY=project(f,{x:-d.sourceX,y:COURSE.deck,z:d.rear}).y;
  if(railX>.987||railBottom< -1.10||railBottom> -1.005||board.x>.94||rearFloorY> -1)continue;
  let x=0,top=-Infinity,bottom=Infinity;for(const [h,r]of envelope){const b=bound(f,h,r);x=Math.max(x,b.x);top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}
  if(x>.92||top>.74||bottom<(aspect>.52?-.52:-.66)||board.bottom-discY<.24)continue;
  const center=(board.top+board.bottom)/2,boardDepth=(board.top-board.bottom)/2;
  if(boardDepth<.075)continue;
  const oldBoardDepth=-base.position.y*s0+base.position.z*c0,scale=oldBoardDepth*tan0/((-y*sn+z*cs)*tangent);
  const value=scale*4-Math.abs(center+.14)*1.5-Math.abs(boardDepth-.105)*.6;
  if(value>score){score=value;best={...f,mode:'presence',far:Math.ceil(Math.hypot(y,z)+160),itemGain:scale,bounds:{x,top,bottom},boardBounds:board,railBounds:{x:railX,bottom:railBottom},boardDepth,discY,rearFloorY,discProjectionRatio:originalK/K,shape:'wide',parent:base};}
 }
 if(!best&&discScale<.98)return launcherFraming(base,prior,d,aspect,points,.98);
 return best||{...prior,mode:'launcher',fitFallback:true,fallbackReason:'No uncropped launcher solution'};
}


function previousLauncherFraming(base,prior,d,aspect,points,discScale=.945){
 const tan0=Math.tan(base.fov*RAD/2),s0=Math.sin(base.pitch),c0=Math.cos(base.pitch);
 const oldDepth=(DISC.originY-base.position.y)*s0-(d.spawn-base.position.z)*c0;
 const originalK=oldDepth*tan0,K=originalK*discScale,discY=-.925,U=discY*K;
 const envelope=new Map();for(const p of points){const r=Math.hypot(p.x,p.z);envelope.set(p.y,Math.max(envelope.get(p.y)||0,r));}
 const rail=[];for(const z of [d.railStart,d.radius,d.targetBoundary,d.spawn,d.railRear])for(const side of [-1,1])for(const y of [-.3,.66])rail.push({x:side*(d.railInner+d.railWidth)-d.sourceX,y,z});
 const project=(f,p)=>{const sn=Math.sin(f.pitch),cs=Math.cos(f.pitch),dy=p.y-f.position.y,dz=p.z-f.position.z,dep=dy*sn-dz*cs;return {x:(p.x-f.position.x)/(dep*f.tangent*aspect),y:(dy*cs+dz*sn)/(dep*f.tangent)};};
 const bound=(f,y,r)=>{const sn=Math.sin(f.pitch),cs=Math.cos(f.pitch),dep=(y-f.position.y)*sn+f.position.z*cs;const a=project(f,{x:0,y,z:-r}).y,b=project(f,{x:0,y,z:r}).y;return{x:(r+Math.abs(f.position.x))/(Math.sqrt(Math.max(.001,dep*dep-r*r*cs*cs))*f.tangent*aspect),top:Math.max(a,b),bottom:Math.min(a,b)};};
 let best=null,score=-Infinity;
 // A genuine perspective camera keeps rendering, target picking and aim rays
 // in one coordinate system. No object, collider, or projected mesh is warped.
 for(let z=80;z<=640;z+=20)for(let deg=7;deg<=36;deg+=.25){
  const pitch=-deg*RAD,sn=Math.sin(pitch),cs=Math.cos(pitch),y=DISC.originY-(U+(z-d.spawn)*sn)/cs;
  const dep=U*Math.tan(pitch)+(z-d.spawn)/cs,tangent=K/dep,f={position:new T.Vector3(base.position.x,y,z),pitch,tangent,fov:2*Math.atan(tangent)/RAD};
  const board=bound(f,COURSE.deck,d.radius+.18);let railX=0,railBottom=Infinity;
  for(const p of rail){const q=project(f,p);railX=Math.max(railX,Math.abs(q.x));railBottom=Math.min(railBottom,q.y);}
  const rearFloorY=project(f,{x:-d.sourceX,y:COURSE.deck,z:d.rear}).y;
  if(railX>.987||railBottom< -1.10||railBottom> -1.005||board.x>.94||rearFloorY> -1)continue;
  let x=0,top=-Infinity,bottom=Infinity;for(const [h,r]of envelope){const b=bound(f,h,r);x=Math.max(x,b.x);top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}
  if(x>.92||top>.74||bottom<(aspect>.52?-.52:-.66)||board.bottom-discY<.24)continue;
  const center=(board.top+board.bottom)/2,boardDepth=(board.top-board.bottom)/2;
  if(boardDepth<.075)continue;
  const oldBoardDepth=-base.position.y*s0+base.position.z*c0,scale=oldBoardDepth*tan0/((-y*sn+z*cs)*tangent);
  const value=scale*4-Math.abs(center+.14)*1.5-Math.abs(boardDepth-.105)*.6;
  if(value>score){score=value;best={...f,mode:'launcher',far:Math.ceil(Math.hypot(y,z)+160),itemGain:scale,bounds:{x,top,bottom},boardBounds:board,railBounds:{x:railX,bottom:railBottom},boardDepth,discY,rearFloorY,discProjectionRatio:originalK/K,shape:'wide',parent:base};}
 }
 if(!best&&discScale<.98)return previousLauncherFraming(base,prior,d,aspect,points,.98);
 return best||{...prior,mode:'launcher',fitFallback:true,fallbackReason:'No uncropped launcher solution'};
}


// Use the installed game's actual perspective rig, attached to the launcher.
// The native frameTower/mobile fit is calculated in the original level space;
// no mesh scale, collider, runway length, or launch position is changed.
function phoneFraming(g,d,aspect,points){
 const P={cameraY:8.2862317,cameraZ:27.37877,spawn:17.05,pitch:19.89179994,fov:47.29027139,cameraRailInner:4.155,launcherBoundary:11.910967057142857};
 let pitch=-P.pitch*RAD,tangent=Math.tan(P.fov*RAD/2);
 if(g.level?.frameTower&&points.length){
  const bottom=Math.atan2(DISC.originY-.7-P.cameraY,P.cameraZ-P.spawn);let top=-Infinity;
  for(const p of points)top=Math.max(top,Math.atan2(p.y-P.cameraY,P.cameraZ-p.z-(d.levelSourceZ||0)));
  let lo=tangent,hi=3;for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(Math.atan(.58*mid)+Math.atan(.78*mid)<top-bottom)lo=mid;else hi=mid;}
  tangent=(lo+hi)/2;pitch=bottom+Math.atan(.78*tangent);
 }
 const sn=Math.sin(pitch),cs=Math.cos(pitch),cornerDepth=(1-P.cameraY)*sn-(P.launcherBoundary-P.cameraZ)*cs;
 tangent=Math.max(tangent,P.cameraRailInner/(cornerDepth*aspect*.86));
 const position=new T.Vector3(-d.sourceX,P.cameraY,d.spawn+P.cameraZ-P.spawn),nativeTangent=tangent;
 // Reserve every rotation and every Elevator load at level start. Preserve
 // the native angle; widen only if a much taller/wider arena needs clearance.
 for(const p of points){const r=Math.hypot(p.x,p.z),dy=p.y-position.y;
  for(let i=0;i<72;i++){const a=i*5*RAD,x=r*Math.sin(a),z=r*Math.cos(a),depth=dy*sn-(z-position.z)*cs,up=dy*cs+(z-position.z)*sn;
   if(depth<=0)continue;tangent=Math.max(tangent,Math.abs(x-position.x)/(depth*aspect*.92),up/(depth*.72));
  }
 }
 const frame={position,pitch,tangent,fov:2*Math.atan(tangent)/RAD,near:.05,far:240,mode:'phone',shape:'wide',nativeRig:P,nativeTangent,needsArenaFit:tangent>nativeTangent+1e-9};
 return frame;
}

// Match the installed game's target-plane composition while retaining the
// same physical runway and the exact projected width of its disc.
// This is one perspective camera shared by meshes, shadows and picking rays.
function closePhoneFraming(g,d,aspect,points){
 const base=phoneFraming(g,d,aspect,points);if(!points.length)return {...base,mode:'close-phone'};
 const P=base.nativeRig,s0=Math.sin(base.pitch),c0=Math.cos(base.pitch),dy=DISC.originY-base.position.y,dz=d.spawn-base.position.z;
 const K=(dy*s0-dz*c0)*base.tangent,initialU=dy*c0+dz*s0,H=Math.max(1,...points.map(p=>p.y)),sourceZ=d.levelSourceZ||0;
 let U=initialU;
 const nativeY=y=>((y-P.cameraY)*c0+(sourceZ-P.cameraZ)*s0)/(((y-P.cameraY)*s0-(sourceZ-P.cameraZ)*c0)*base.nativeTangent);
 const desiredFloor=nativeY(0),desiredTop=nativeY(H);
 const pose=(z,pitch)=>{const sn=Math.sin(pitch),cs=Math.cos(pitch),y=DISC.originY-(U+(z-d.spawn)*sn)/cs,tangent=K/(U*Math.tan(pitch)+(z-d.spawn)/cs);
  return {position:new T.Vector3(base.position.x,y,z),pitch,tangent,fov:2*Math.atan(tangent)/RAD,near:.05,far:240};};
 const project=(f,x,y,z)=>{const sn=Math.sin(f.pitch),cs=Math.cos(f.pitch),dy=y-f.position.y,dz=z-f.position.z,depth=dy*sn-dz*cs;
  return {x:(x-f.position.x)/(depth*f.tangent*aspect),y:(dy*cs+dz*sn)/(depth*f.tangent),depth};};
 const atDistance=z=>{let lo=-40*RAD,hi=-1*RAD;for(let i=0;i<42;i++){const mid=(lo+hi)/2;if(project(pose(z,mid),0,0,0).y>desiredFloor)lo=mid;else hi=mid;}return pose(z,(lo+hi)/2);};
 // Fit once against ALL authored loads, including the rotational envelope.
 // Never reframe to the smaller live bounds during collapse or arrival.
 const envelope=new Map();for(const p of points)envelope.set(p.y,Math.max(envelope.get(p.y)||0,Math.hypot(p.x,p.z)));
 const bounds=f=>{let maxX=0,top=-Infinity,bottom=Infinity,boardX=0;for(const [y,r]of envelope){for(let i=0;i<72;i++){const a=i*5*RAD,q=project(f,r*Math.sin(a),y,r*Math.cos(a));maxX=Math.max(maxX,Math.abs(q.x));top=Math.max(top,q.y);bottom=Math.min(bottom,q.y);}}
  for(let i=0;i<72;i++){const a=i*5*RAD,q=project(f,(d.radius+.18)*Math.sin(a),.025,(d.radius+.18)*Math.cos(a));boardX=Math.max(boardX,Math.abs(q.x));}
  return {maxX,top,bottom,boardX};};
 const fits=b=>b.maxX<=.92&&b.top<=.70&&b.boardX<=.93;
 let frame,b,desiredZ;
 // The longer perspective lens must not reveal the runway's rear end at the
 // bottom of the screen. Move only the framing of the launch disc down by
 // the minimum necessary amount; the physical launch position never moves.
 for(let step=0;step<=16;step++){
  U=initialU-step*.01*K;
  let lo=base.position.z,hi=d.spawn+130;for(let i=0;i<42;i++){const mid=(lo+hi)/2,f=atDistance(mid);if(project(f,0,H,0).y<desiredTop)lo=mid;else hi=mid;}
  desiredZ=(lo+hi)/2;frame=atDistance(desiredZ);b=bounds(frame);
  if(!fits(b)){lo=base.position.z;hi=desiredZ;for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(fits(bounds(atDistance(mid))))lo=mid;else hi=mid;}frame=atDistance(lo);b=bounds(frame);}
  if(project(frame,-d.sourceX,.025,d.rear).y<=-1.015)break;
 }
 if(!fits(b))return {...base,mode:'close-phone',fitLimited:true};
 const oldDepth=(H*.5-base.position.y)*s0+base.position.z*c0,newDepth=(H*.5-frame.position.y)*Math.sin(frame.pitch)+frame.position.z*Math.cos(frame.pitch);
 return {...frame,mode:'close-phone',shape:'wide',bounds:b,itemGain:oldDepth*base.tangent/(newDepth*frame.tangent),nativeFloor:desiredFloor,nativeTop:desiredTop,fitLimited:frame.position.z<desiredZ-.001,discWidthPreserved:true,discScreenY:(1-U/K)/2,rearFloorY:project(frame,-d.sourceX,.025,d.rear).y};
}

const proto=Object.getPrototypeOf(g.arenaView),oldFit=proto.fit,oldBuild=proto.build;
function compactTrack(v){const R=v.config.radius;
 for(const o of v.root.children){const p=o.geometry?.parameters;if(!p)continue;
  if(o.geometry.type==='TorusGeometry'&&Math.abs(o.position.y+1.05)<.001){const radius=p.radius<R+.65?R+.21:R+.55,previous=o.geometry;o.geometry=new previous.constructor(radius,.08,12,128);previous.dispose();}
  if(o.geometry.type==='BoxGeometry'&&p.width===.16&&p.height===.16&&Math.abs(o.position.y+1.24)<.001){const start=R+.25,end=R+.55,angle=o.rotation.y,previous=o.geometry;o.geometry=new previous.constructor(.16,.16,end-start);o.position.set(Math.sin(angle)*(start+end)/2,-1.24,Math.cos(angle)*(start+end)/2);previous.dispose();}
 }
 for(const o of v.deck.children){const p=o.geometry?.parameters;if(!p||Math.abs(Math.abs(o.position.x)-3.8)>.001)continue;const oldZ=Math.sqrt((R+.65)**2-3.8**2),newZ=Math.sqrt((R+.38)**2-3.8**2);
  if((o.geometry.type==='BoxGeometry'&&p.width===.5&&p.height===.5)||(o.geometry.type==='CylinderGeometry'&&p.radiusTop===.3&&p.height===.18))o.position.z+=newZ-oldZ;
 }
}
proto.build=function(...args){const value=oldBuild.apply(this,args);compactTrack(this);return value;};
proto.fit=function(){const mode=this.framingMode;this.framingMode='platform';oldFit.call(this);this.framingMode=mode;
 const prior=this.framing;
 const aspect=this.g.canvas.clientWidth/this.g.canvas.clientHeight||.5;
 let frame=(mode==='before'?previousLauncherFraming:launcherFraming)(prior.parent||prior,prior,this.dim,aspect,this.framePoints);
 frame=this.g.cameraPresentation==='phone-before'?phoneFraming(this.g,this.dim,aspect,this.framePoints):closePhoneFraming(this.g,this.dim,aspect,this.framePoints);this.cameraOffset=frame.position;this.pitch=frame.pitch;this.framing=frame;
 this.g.camera.near=frame.near??40;this.g.camera.far=frame.far||this.previousFar;this.g.camera.fov=this.overview?46:frame.fov;this.g.camera.updateProjectionMatrix();this.camera();this.g.fitBackdrop();
};
compactTrack(g.arenaView);g.arenaView.fit();window.LAUNCHER_REVIEW={version:23,renderOnly:true,setCamera(mode){g.cameraPresentation=mode==='phone-before'?'phone-before':'close-phone';g.arenaView.fit();}};
})();
