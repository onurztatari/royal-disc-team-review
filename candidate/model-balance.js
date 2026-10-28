// Stage 27: body/frame balance and a rolled can end profile. Render-only.
function installModelBalance(g){
 if(g.modelBalance)return g.modelBalance;
 const amount={value:1},patched=new WeakSet(),geometries=new WeakMap();
 const stats={plasticFaces:0,canProfiles:0,compiled:0};let enabled=true;
 function canGeometry(source){
  if(source.userData.modelBalance27&&source.attributes.modelDelta27)return source;
  if(geometries.has(source))return geometries.get(source);
  const p=source.attributes.position,n=source.attributes.formNormal26,c=source.attributes.capDelta25,f=source.attributes.formDelta26;
  if(!n||!c||!f)throw Error('Model balance requires prepared can geometry');
  source.computeBoundingBox();const b=source.boundingBox,centre=[(b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,(b.min.z+b.max.z)/2];
  const half=(b.max.x-b.min.x)/2,radius=Math.max((b.max.y-b.min.y)/2,(b.max.z-b.min.z)/2),roll=Math.min(.075,radius*.15);
  const geo=source.clone(),delta=new Float32Array(p.count*3),normals=new Float32Array(p.count*3),A=p.constructor;
  for(let i=0;i<p.count;i++){
   const original=[p.getX(i),p.getY(i),p.getZ(i)],old=[original[0]+c.getX(i)+f.getX(i),original[1]+c.getY(i)+f.getY(i),original[2]+c.getZ(i)+f.getZ(i)];
   const x=original[0]-centre[0],y=original[1]-centre[1],z=original[2]-centre[2],rad=Math.hypot(y,z),ax=Math.abs(x);
   let target=old.slice(),normal=[n.getX(i),n.getY(i),n.getZ(i)];
   if(ax>half-roll&&rad>radius-roll){
    // Cut a round shoulder inward; never enlarge the physical envelope.
    const dx=ax-(half-roll),dr=rad-(radius-roll),len=Math.hypot(dx,dr);
    if(len>1e-8){
     const nx=dx/len,nr=dr/len,newRadius=radius-roll+nr*roll;
     target=[centre[0]+Math.sign(x)*(half-roll+nx*roll),centre[1]+y/rad*newRadius,centre[2]+z/rad*newRadius];
     normal=[Math.sign(x)*nx,y/rad*nr,z/rad*nr];
    }
   }
   delta.set(target.map((v,j)=>v-old[j]),i*3);normals.set(normal,i*3);
  }
  geo.setAttribute('modelDelta27',new A(delta,3));geo.setAttribute('modelNormal27',new A(normals,3));
  geo.userData={...source.userData,modelBalance27:true};geometries.set(source,geo);stats.canProfiles++;return geo;
 }
 function material(m,kind,o,bodyColour){
  if(patched.has(m))return;patched.add(m);const prior=m.onBeforeCompile,key=m.customProgramCacheKey();
  let half;
  if(kind==='plastic'){
   o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
   half={x:(b.max.x-b.min.x)/2,y:(b.max.y-b.min.y)/2};stats.plasticFaces++;
  }
  m.onBeforeCompile=function(s,renderer){
   prior.call(this,s,renderer);if(s.fragmentShader.includes('uniform float royalModel27;'))return;
   stats.compiled++;s.uniforms.royalModel27=amount;
   s.fragmentShader='uniform float royalModel27;\n'+s.fragmentShader;
   if(kind==='plastic'){
    s.uniforms.modelBody27={value:bodyColour};s.uniforms.modelHalf27={value:half};
    s.fragmentShader='uniform vec3 modelBody27;\nuniform vec2 modelHalf27;\n'+s.fragmentShader;
    const marker='vec3 royalArtistPaint=diffuseColor.rgb;';
    if(!s.fragmentShader.includes(marker))throw Error('Plastic paint contract changed');
    s.fragmentShader=s.fragmentShader.replace(marker,marker+`
     vec2 toEdge27=modelHalf27*(vec2(1.0)-abs(vFormCoord26));
     float edge27=min(toEdge27.x,toEdge27.y);
     float frame27=smoothstep(.025,.065,edge27)*(1.0-smoothstep(.155,.245,edge27));
     // Suppress the baked white/black outline; keep the supplied diamond and UVs.
     royalArtistPaint=mix(royalArtistPaint,modelBody27*1.05,frame27*.58*royalModel27);
     diffuseColor.rgb=royalArtistPaint;
    `);
   }else{
    s.vertexShader='uniform float royalModel27;\nattribute vec3 modelDelta27;\nattribute vec3 modelNormal27;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=modelDelta27*royalModel27;');
    const marker='objectNormal=normalize(mix(objectNormal,formNormal26,royalForm26));';
    if(!s.vertexShader.includes(marker))throw Error('Can normal contract changed');
    s.vertexShader=s.vertexShader.replace(marker,marker+'\nobjectNormal=normalize(mix(objectNormal,modelNormal27,royalModel27));');
    s.fragmentShader=s.fragmentShader.replace('gl_FragColor.rgb*=mix(1.0,lidFinish,lidArea);',`
     // A single recessed centre and broad rim survive reduction to phone size.
     float centre27=1.0-smoothstep(.64,.88,lidRadius);
     lidFinish=mix(lidFinish,1.04-.19*centre27,royalModel27);
     gl_FragColor.rgb*=mix(1.0,lidFinish,lidArea);
    `);
   }
  };
  m.customProgramCacheKey=()=>key+':model-balance27-'+kind;m.needsUpdate=true;
 }
 function items(root,kind){
  if(kind!=='can'&&kind!=='plastic')return;
  let bodyColour;root.traverse(o=>{if(o.isMesh&&o.material?.userData.colourPreservingSatin)bodyColour=o.material.color.clone();});
  root.traverse(o=>{
   if(!o.isMesh)return;
   for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(kind==='can'&&m.isMeshPhysicalMaterial){o.geometry=canGeometry(o.geometry);material(m,'can',o);}
    else if(kind==='plastic'&&m.userData.plasticContactFace&&bodyColour)material(m,'plastic',o,bodyColour);
   }
  });
 }
 const clone=g.art.clone.bind(g.art);g.art.clone=function(kind,...args){const root=clone(kind,...args);items(root,kind);return root;};
 function refresh(){
  g.formReadability?.refresh();
  for(const e of g.targets||[])items(e.root,e.kind);
  g.scene.traverse(o=>{if(o.isInstancedMesh&&geometries.has(o.geometry))o.geometry=geometries.get(o.geometry);});
  g.graphics.shadowDirty=true;
 }
 let generation=-1,count=-1;const render=g.render;
 g.render=function(...args){if(generation!==g.generation||count!==g.targets.length){generation=g.generation;count=g.targets.length;refresh();}return render.apply(this,args);};
 g.addEventListener('level',()=>queueMicrotask(refresh));
 const api=g.modelBalance={set(value){enabled=!!value;amount.value=enabled?1:0;g.graphics.shadowDirty=true;g.renderer.shadowMap.needsUpdate=true;},get enabled(){return enabled;},refresh,inspect(){return{enabled,...stats,extraTriangles:0,extraDrawPasses:0,extraShadowSamples:0,woodGlassUnchanged:g.formReadability.inspect().protectedMaterialsUnchanged};}};
 refresh();return api;
}
installModelBalance(window.SMASH);

