// Stage 28: final render meshes, with no new passes or physics changes.
function installSilhouetteProfile(g){
 if(g.silhouetteProfile)return g.silhouetteProfile;
 const enhancedFor=new WeakMap(),afterFor=new WeakMap(),beforeFor=new WeakMap(),scenes=new Set([g.scene]);
 const stats={plasticBodies:0,plasticFaces:0,canProfiles:0,preservedSquareCans:0,extraTriangles:0,extraDrawPasses:0,extraAttributes:0};
 let enabled=true;
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const dish=r=>.105*(1-smooth(.50,.85,r));
 function sculpt(source,kind){
  const selected=kind==='can'&&g.referenceGeometry30?enhancedFor:afterFor;
  if(selected.has(source))return selected.get(source);
  const geo=source.clone();geo.userData={...source.userData,silhouette28:kind};
  source.computeBoundingBox();const b=source.boundingBox,p=source.attributes.position,pp=geo.attributes.position,nn=geo.attributes.normal;
  const h=[(b.max.x-b.min.x)/2,(b.max.y-b.min.y)/2,(b.max.z-b.min.z)/2],c=[(b.max.x+b.min.x)/2,(b.max.y+b.min.y)/2,(b.max.z+b.min.z)/2];
  if(kind==='can'){
   const radius=Math.max(h[1],h[2]);let maxRadius=0;
   for(let i=0;i<p.count;i++)maxRadius=Math.max(maxRadius,Math.hypot(p.getY(i)-c[1],p.getZ(i)-c[2]));
   // Campaign square containers are a separate approved model, not cylinders.
   if(maxRadius>radius*1.13){geo.dispose();selected.set(source,source);stats.preservedSquareCans++;return source;}
  }
  const shoulder=.225;
  if(kind==='plastic-body'){
   // Redistribute the existing 8x8 face grid around a broad, round shoulder.
   const grid=new source.constructor(h[0]*2,h[1]*2,h[2]*2,8,8,8),gp=grid.attributes.position;
   if(gp.count!==p.count)throw Error('Plastic topology changed');
   const edge=(v,half)=>{const k=Math.round((v/half+1)*4),r=shoulder;return[-half,-half+r*.18,-half+r*.5,-half+r,0,half-r,half-r*.5,half-r*.18,half][k];};
   for(let i=0;i<p.count;i++){
    const v=[edge(gp.getX(i),h[0]),edge(gp.getY(i),h[1]),edge(gp.getZ(i),h[2])];
    const core=v.map((x,j)=>Math.max(-h[j]+shoulder,Math.min(h[j]-shoulder,x))),d=v.map((x,j)=>x-core[j]),length=Math.hypot(...d)||1;
    pp.setXYZ(i,...core.map((x,j)=>c[j]+x+d[j]/length*shoulder));nn.setXYZ(i,...d.map(x=>x/length));
   }grid.dispose();stats.plasticBodies++;
  }else if(kind==='plastic-face'){
   // The original painted face follows the new shoulder. Only its outer edge
   // contracts; the emblem centre, source bitmap, UVs and opacity stay intact.
   for(let i=0;i<p.count;i++){
    let x=p.getX(i)-c[0],y=p.getY(i)-c[1];
    x-=Math.sign(x)*.032*smooth(.32,.92,Math.abs(x)/h[0]);
    y-=Math.sign(y)*.032*smooth(.32,.92,Math.abs(y)/h[1]);
    let dx=Math.max(0,Math.abs(x)-(h[0]-shoulder)),dy=Math.max(0,Math.abs(y)-(h[1]-shoulder));
    const radial=Math.hypot(dx,dy),limit=shoulder-.006;
    if(radial>limit){dx*=limit/radial;dy*=limit/radial;x=Math.sign(x)*(h[0]-shoulder+dx);y=Math.sign(y)*(h[1]-shoulder+dy);}
    const z=Math.sqrt(Math.max(0,shoulder*shoulder-dx*dx-dy*dy))-shoulder;
    pp.setXYZ(i,c[0]+x,c[1]+y,z);
   }geo.computeVertexNormals();stats.plasticFaces++;
  }else{
   const radius=Math.max(h[1],h[2]),roll=Math.min(g.referenceGeometry30?.175:.125,radius*(g.referenceGeometry30?.35:.25)),sign=x=>x<0?-1:1;
   function profile(x,y,z){
    const ax=Math.abs(x),r=Math.hypot(y,z),sx=sign(x);let tx=x,tr=r;
    if(ax>h[0]-roll&&r>radius-roll){
     const dx=ax-(h[0]-roll),dr=r-(radius-roll),len=Math.hypot(dx,dr);
     tx=sx*(h[0]-roll+dx/len*roll);tr=radius-roll+dr/len*roll;
    }
    // A shallow waist under the rolled lip separates the lid from the barrel.
    const s=h[0]-ax,waist=.027*Math.exp(-Math.pow((s-.155)/.048,2))*smooth(.80,.94,r/radius);
    tr=Math.max(0,tr-waist);
    if(Math.abs(source.attributes.normal.getX(currentIndex))>.985){
     tx=sx*Math.min(Math.abs(tx),h[0]-dish(r/radius));
    }
    return [tx,r>1e-8?y/r*tr:0,r>1e-8?z/r*tr:0];
   }
   // The mesh has welded-looking but separate UV/chart vertices. Recompute
   // analytic transformed normals from the deformation Jacobian, not a seam-
   // producing per-triangle average.
   let currentIndex=0;const epsilon=.0001;
   for(let i=0;i<p.count;i++){
    currentIndex=i;
    const v=[p.getX(i)-c[0],p.getY(i)-c[1],p.getZ(i)-c[2]],target=profile(...v);
    pp.setXYZ(i,...target.map((x,j)=>x+c[j]));
    const n=source.attributes.normal;let normal=[n.getX(i),n.getY(i),n.getZ(i)];
    const axis=Math.abs(normal[0])<.9?[1,0,0]:[0,1,0];
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const t1=cross(normal,axis),len=Math.hypot(...t1)||1;t1.forEach((_,j)=>t1[j]/=len);const t2=cross(normal,t1);
    const tangent=t=>{const a=profile(...v.map((x,j)=>x+t[j]*epsilon)),b=profile(...v.map((x,j)=>x-t[j]*epsilon));return a.map((x,j)=>x-b[j]);};
    const transformed=cross(tangent(t1),tangent(t2)),nl=Math.hypot(...transformed);
    if(nl>1e-12)normal=transformed.map(x=>x/nl);
    nn.setXYZ(i,...normal);
   }stats.canProfiles++;
  }
  // Bake the approved final shape once. The existing shader attributes are
  // neutralized, so colour and shadow passes use the same actual silhouette.
  for(const name of ['capDelta25','formDelta26','modelDelta27'])if(geo.attributes[name])geo.attributes[name].array.fill(0);
  for(const name of ['capNormal25','formNormal26','modelNormal27'])if(geo.attributes[name])geo.setAttribute(name,geo.attributes.normal.clone());
  geo.computeBoundingBox();geo.computeBoundingSphere();
  selected.set(source,geo);beforeFor.set(geo,source);return geo;
 }
 function kindOf(o){
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(m?.userData.plasticContactFace)return 'plastic-face';
   if(m?.userData.colourPreservingSatin)return 'plastic-body';
  }
  const geo=beforeFor.get(o.geometry)||o.geometry;
  return geo?.userData.modelBalance27&&geo.attributes.modelDelta27?'can':null;
 }
 function update(root){
  root?.traverse(o=>{
   if(!o.isMesh)return;const kind=kindOf(o);if(!kind)return;
   const source=beforeFor.get(o.geometry)||o.geometry;
   o.geometry=enabled?sculpt(source,kind):source;
  });
 }
 const clone=g.art.clone.bind(g.art);g.art.clone=function(kind,...args){const root=clone(kind,...args);if(kind==='can'||kind==='plastic')update(root);return root;};
 function refresh(){
  g.modelBalance?.refresh();
  for(const e of g.targets||[])if(e.kind==='plastic'||e.kind==='can')update(e.root);
  for(const scene of scenes)update(scene);
  g.graphics.shadowDirty=true;g.renderer.shadowMap.needsUpdate=true;
 }
 let count=-1,generation=-1;const render=g.render;
 g.render=function(...args){if(count!==g.targets.length||generation!==g.generation){count=g.targets.length;generation=g.generation;refresh();}return render.apply(this,args);};
 g.addEventListener('level',()=>queueMicrotask(refresh));
 const api=g.silhouetteProfile={set(value){enabled=!!value;refresh();},get enabled(){return enabled;},refresh,registerScene(scene){scenes.add(scene);refresh();},inspect(){return{enabled,...stats,shoulderRadius:shoulderValue(),capRollRadius:g.referenceGeometry30?.175:.125,woodGlassUnchanged:g.formReadability.inspect().protectedMaterialsUnchanged};}};
 function shoulderValue(){return .225;}
 refresh();return api;
}
installSilhouetteProfile(window.SMASH);

