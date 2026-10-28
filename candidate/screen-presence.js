(()=>{
'use strict';
// A single perspective camera: preserve the launch disc's pixel scale and
// centre, then spend unused board/header margins on the authored structure.
// No render/physics scale changes, no live-pile reframing, no per-frame search.
const RAD = Math.PI / 180;
function screenPresenceFraming(base, d, aspect, points, originY) {
  if (!points?.length || !(aspect > 0) || !base.position?.clone) return base;
  const tangent0 = Math.tan(base.fov * RAD / 2);
  const envelope = new Map();
  for (const p of points) envelope.set(p.y, Math.max(envelope.get(p.y) || 0, Math.hypot(p.x, p.z)));
  const H = Math.max(...envelope.keys());
  const sideTop = Math.max(.50, .62-Math.max(0,aspect-.5)*.8);
  const project = (f, x, y, z) => {
    const s = Math.sin(f.pitch), c = Math.cos(f.pitch);
    const dy = y - f.position.y, dz = z - f.position.z, depth = dy * s - dz * c;
    return {x:(x-f.position.x)/(depth*f.tangent*aspect), y:(dy*c+dz*s)/(depth*f.tangent), depth};
  };
  const before = {...base, tangent:tangent0};
  const disc = project(before, -d.sourceX, originY, d.spawn);
  const K = disc.depth*tangent0, U = disc.y*K;
  const oldEye = Math.atan2(base.position.y, base.position.z);
  const oldHeight = project(before,0,H,0).y-project(before,0,0,0).y;
  const oldScale = project(before,0,H*.5,0).depth*tangent0;
  if (!(K>0) || !(oldHeight>0)) return base;
  const bound = (f,y,r) => {
    const s=Math.sin(f.pitch), c=Math.cos(f.pitch), depth=(y-f.position.y)*s+f.position.z*c;
    const square=depth*depth-r*r*c*c;
    if (!(square>0)) return {x:Infinity,top:Infinity,bottom:-Infinity};
    const a=project(f,0,y,-r).y,b=project(f,0,y,r).y;
    return {x:(r+Math.abs(f.position.x))/(Math.sqrt(square)*f.tangent*aspect),top:Math.max(a,b),bottom:Math.min(a,b)};
  };
  let best=null,bestScore=1.102;
  const consider=(z,pitch)=>{
    const s=Math.sin(pitch),c=Math.cos(pitch),y=originY-(U+(z-d.spawn)*s)/c;
    const tangent=K/(U*Math.tan(pitch)+(z-d.spawn)/c);
    if (!(tangent>0) || y<1 || Math.abs(Math.atan2(y,z)-oldEye)>6*RAD) return;
    const f={position:base.position.clone().set(base.position.x,y,z),pitch,tangent};
    const board=bound(f,.025,d.radius+.18),track=bound(f,-1.05,d.radius+.63);
    if(board.x>.965 || board.bottom<-.55 || board.top>.5 || board.top-board.bottom<.115) return;
    let maxX=0,top=-Infinity,bottom=Infinity;
    for(const [h,r] of envelope){const b=bound(f,h,r);maxX=Math.max(maxX,b.x);top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);if(maxX>.93||b.top>(b.x<.44?.70:sideTop)||bottom<-.50)return;}
    const rearFloorY=project(f,-d.sourceX,.025,d.rear).y;
    if(rearFloorY>-1.005)return;
    const widthGain=oldScale/(project(f,0,H*.5,0).depth*tangent);
    const heightGain=(project(f,0,H,0).y-project(f,0,0,0).y)/oldHeight;
    // Prefer balanced growth; do not flatten a tower to gain horizontal width.
    const score=Math.min(widthGain,heightGain)+.1*heightGain;
    if(widthGain<1.015||heightGain<1.015||score<=bestScore)return;
    bestScore=score;
    best={...base,...f,fov:2*Math.atan(tangent)/RAD,bounds:{maxX,top,bottom,boardX:board.x,trackX:track.x},
      rearFloorY,discWidthPreserved:true,discScreenY:(1-disc.y)/2,
      screenPresence:{version:29,widthGain,heightGain,boardMargin:(1-board.x)/2,discCenterError:Math.abs(project(f,-d.sourceX,originY,d.spawn).y-disc.y)}};
  };
  // Bounded fit only at load/resize. Refinement is subpixel at phone sizes.
  for(let z=base.position.z;z<=base.position.z+48;z+=1)
    for(let deg=2;deg<=24;deg+=.5)consider(z,-deg*RAD);
  if(best){const z0=best.position.z,p0=best.pitch;for(let dz=-.875;dz<=.875;dz+=.125)for(let dp=-.4375;dp<=.4375;dp+=.0625)consider(z0+dz,p0+dp*RAD);}
  return best || {...base,screenPresence:{version:29,widthGain:1,heightGain:1,fitLimited:true}};
}

const g=window.SMASH;if(!g?.arenaView)return;
const proto=Object.getPrototypeOf(g.arenaView),previousFit=proto.fit;
let enabled=true;
const cache=new WeakMap();
proto.fit=function(...args){
 const out=previousFit.apply(this,args);if(!enabled||this.g.cameraPresentation==='phone-before')return out;
 const aspect=this.g.canvas.clientWidth/this.g.canvas.clientHeight||.5,base=this.framing;
 const key=[aspect,base.fov,base.pitch,base.position.x,base.position.y,base.position.z,this.framePoints.length].join(':');
 let found=cache.get(this);
 if(found?.key!==key||found?.points!==this.framePoints||found?.dim!==this.dim){found={key,points:this.framePoints,dim:this.dim,frame:screenPresenceFraming(base,this.dim,aspect,this.framePoints,.756/2*.64+.025)};cache.set(this,found);}
 const frame=found.frame;this.cameraOffset=frame.position;this.pitch=frame.pitch;this.framing=frame;
 this.g.camera.fov=this.overview?46:frame.fov;this.g.camera.updateProjectionMatrix();this.camera();this.g.fitBackdrop();return out;
};
g.screenPresence={set(value){enabled=!!value;g.arenaView?.fit();},inspect(){return{enabled,...g.arenaView?.framing?.screenPresence};}};
g.arenaView.fit();
})();
