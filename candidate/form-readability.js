// Stage 26: form readability inside the existing render/physics envelope.
function installFormReadability(g){
 if(g.formReadability)return g.formReadability;
 const amount={value:1},patched=new WeakSet(),geometryPairs=new WeakMap(),protectedMaterials=new Map();
 const metrics={plasticBodies:0,plasticFaces:0,canCaps:0,compiled:0,maxInset:0};let enabled=true;
 const each=(root,fn)=>root?.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)fn(m,o);});
 const signature=m=>JSON.stringify({color:m.color?.getHex(),map:m.map?.uuid,normalMap:m.normalMap?.uuid,roughness:m.roughness,metalness:m.metalness,clearcoat:m.clearcoat,opacity:m.opacity,shader:String(m.onBeforeCompile),key:m.customProgramCacheKey()});
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const depth=r=>.075*(1-smooth(.52,.90,r));
 function geometry(source,kind){
  if(source.userData.formReadability26&&source.attributes.formDelta26)return source;
  if(geometryPairs.has(source))return geometryPairs.get(source);
  source.computeBoundingBox();const box=source.boundingBox,p=source.attributes.position,n=source.attributes.normal,A=p.constructor;
  const geo=source.clone(),delta=new Float32Array(p.count*3),normals=new Float32Array(p.count*3),coords=new Float32Array(p.count*2);
  const half=[(box.max.x-box.min.x)/2,(box.max.y-box.min.y)/2,(box.max.z-box.min.z)/2],centre=[(box.min.x+box.max.x)/2,(box.min.y+box.max.y)/2,(box.min.z+box.max.z)/2];
  let target;
  if(kind==='plastic-body'){
   // Same grid/envelope; a wider shoulder makes the light roll legible.
   target=new source.constructor(half[0]*2,half[1]*2,half[2]*2,8,8,8);
   if(target.attributes.position.count!==p.count)throw Error('Plastic body geometry contract changed');
   const tp=target.attributes.position,tn=target.attributes.normal,r=.15;
   const edge=(value,h)=>{const i=Math.round((value/h+1)*4);return[-h,-h+r*.18,-h+r*.5,-h+r,0,h-r,h-r*.5,h-r*.18,h][i];};
   for(let i=0;i<tp.count;i++){
    const v=[edge(tp.getX(i),half[0]),edge(tp.getY(i),half[1]),edge(tp.getZ(i),half[2])];
    const q=v.map((x,j)=>Math.max(-half[j]+r,Math.min(half[j]-r,x))),d=v.map((x,j)=>x-q[j]),l=Math.hypot(...d)||1;
    tp.setXYZ(i,...q.map((x,j)=>x+d[j]/l*r+centre[j]));tn.setXYZ(i,...d.map(x=>x/l));
   }metrics.plasticBodies++;
  }else if(kind==='plastic-face'){
   target=source.clone();const tp=target.attributes.position,r=.15;
   for(let i=0;i<p.count;i++){
    const dx=Math.max(0,Math.abs(p.getX(i)-centre[0])-(half[0]-r)),dy=Math.max(0,Math.abs(p.getY(i)-centre[1])-(half[1]-r));
    tp.setZ(i,Math.sqrt(Math.max(0,r*r-dx*dx-dy*dy))-r);
   }target.computeVertexNormals();metrics.plasticFaces++;
  }else{
   const oldDelta=source.attributes.capDelta25;if(!oldDelta)throw Error('Can cap needs Stage 25 first');
   for(let i=0;i<p.count;i++){
    const y=(p.getY(i)-centre[1])/half[1],z=(p.getZ(i)-centre[2])/half[2],r=Math.hypot(y,z);
    if(Math.abs(n.getX(i))>.985){
     const sign=Math.sign(n.getX(i)),d=depth(r),slope=(depth(r+.0001)-depth(r-.0001))/.0002;
     delta[i*3]=-sign*d-oldDelta.getX(i);
     const dy=r>1e-6?slope*y/(r*half[1]):0,dz=r>1e-6?slope*z/(r*half[2]):0,l=Math.hypot(1,dy,dz);
     normals.set([sign/l,dy/l,dz/l],i*3);metrics.maxInset=Math.max(metrics.maxInset,d);
    }else{const nn=source.attributes.capNormal25||n;normals.set([nn.getX(i),nn.getY(i),nn.getZ(i)],i*3);}
    coords.set([y,z],i*2);
   }metrics.canCaps++;
  }
  if(target){
   const tp=target.attributes.position,tn=target.attributes.normal;
   for(let i=0;i<p.count;i++){
    delta.set([tp.getX(i)-p.getX(i),tp.getY(i)-p.getY(i),tp.getZ(i)-p.getZ(i)],i*3);
    normals.set([tn.getX(i),tn.getY(i),tn.getZ(i)],i*3);
    coords.set([(p.getX(i)-centre[0])/half[0],(p.getY(i)-centre[1])/half[1]],i*2);
   }target.dispose();
  }
  geo.setAttribute('formDelta26',new A(delta,3));geo.setAttribute('formNormal26',new A(normals,3));geo.setAttribute('formCoord26',new A(coords,2));
  geo.userData={...source.userData,formReadability26:kind};geometryPairs.set(source,geo);return geo;
 }
 function material(m,kind){
  if(patched.has(m))return;patched.add(m);const prior=m.onBeforeCompile,key=m.customProgramCacheKey();
  m.onBeforeCompile=function(s,renderer){
   prior.call(this,s,renderer);if(s.fragmentShader.includes('uniform float royalForm26;'))return;
   metrics.compiled++;s.uniforms.royalForm26=amount;
   s.vertexShader='uniform float royalForm26;\nattribute vec3 formDelta26;\nattribute vec3 formNormal26;\nattribute vec2 formCoord26;\nvarying vec2 vFormCoord26;\n'+s.vertexShader;
   s.fragmentShader='uniform float royalForm26;\nvarying vec2 vFormCoord26;\n'+s.fragmentShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=formDelta26*royalForm26;vFormCoord26=formCoord26;');
   const marker=kind==='can'?'objectNormal=normalize(mix(objectNormal,capNormal25,royalContactVolume25));':'#include <beginnormal_vertex>';
   if(!s.vertexShader.includes(marker))throw Error('Form normal shader contract changed: '+kind);
   s.vertexShader=s.vertexShader.replace(marker,marker+'\nobjectNormal=normalize(mix(objectNormal,formNormal26,royalForm26));');
   if(kind==='plastic-face'){
    // Keep the supplied centre/diamond. Connect the surrounding paint to the
    // rounded body's real light response. No image/UV/opacity-rule changes.
    const paint='gl_FragColor.rgb=mix(gl_FragColor.rgb,royalArtistPaint,royalInkMask*0.960);';
    if(!s.fragmentShader.includes(paint))throw Error('Plastic artwork shader contract changed');
    s.vertexShader='varying vec3 formRoundView26;\n'+s.vertexShader;s.fragmentShader='varying vec3 formRoundView26;\n'+s.fragmentShader;
    s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`
     vec3 roll26=vec3(formCoord26.x*.32,formCoord26.y*.20,0.0);
     #ifdef USE_INSTANCING
      roll26=mat3(instanceMatrix)*roll26;
     #endif
     formRoundView26=normalMatrix*roll26;
     #include <project_vertex>
    `);
    s.fragmentShader=s.fragmentShader.replace('#include <lights_physical_fragment>',`
     float paintedCentre26=1.0-smoothstep(.16,.46,length(vFormCoord26));
     normal=normalize(normal+formRoundView26*royalForm26*(1.0-paintedCentre26*.8));
     #include <lights_physical_fragment>
    `);
    s.fragmentShader=s.fragmentShader.replace(paint,`
     float paintRetention26=mix(.80,.96,paintedCentre26);
     gl_FragColor.rgb=mix(gl_FragColor.rgb,royalArtistPaint,royalInkMask*mix(.96,paintRetention26,royalForm26));
     float keyFacing26=.55;
     #if NUM_DIR_LIGHTS > 0
      keyFacing26=max(0.0,dot(normal,normalize(directionalLights[0].direction)));
     #endif
     float curvedLight26=.84+.30*keyFacing26;
     gl_FragColor.rgb*=mix(1.0,curvedLight26,royalForm26*(1.0-paintedCentre26*.85));
    `);
   }else if(kind==='plastic-body'){
    s.fragmentShader=s.fragmentShader.replace('#include <lights_physical_fragment>',`
     roughnessFactor=mix(roughnessFactor,.50,royalForm26);
     #include <lights_physical_fragment>
    `);
   }else{
    s.fragmentShader=s.fragmentShader.replace('#include <lights_physical_fragment>',`
     float rolledRim26=smoothstep(.60,.82,length(vFormCoord26))*royalCanCap*royalForm26;
     roughnessFactor=mix(roughnessFactor,.31,rolledRim26);
     #include <lights_physical_fragment>
    `);
    s.fragmentShader=s.fragmentShader.replace('gl_FragColor.rgb*=mix(1.0,lidFinish,lidArea);',`
     float broadLip26=smoothstep(.70,.88,lidRadius);
     lidFinish=mix(lidFinish,1.0-.12*(1.0-broadLip26),royalForm26);
     gl_FragColor.rgb*=mix(1.0,lidFinish,lidArea);
    `);
   }
  };m.customProgramCacheKey=()=>key+':form-readability26-'+kind;m.needsUpdate=true;
 }
 function items(root,kind){
  if(kind==='wood'||kind==='glass'){each(root,m=>{if(!protectedMaterials.has(m))protectedMaterials.set(m,{kind,signature:signature(m)});});return;}
  if(kind!=='plastic'&&kind!=='can')return;
  each(root,(m,o)=>{
   const type=kind==='can'?(m.isMeshPhysicalMaterial?'can':null):m.userData.plasticContactFace?'plastic-face':m.userData.colourPreservingSatin?'plastic-body':null;
   if(type){o.geometry=geometry(o.geometry,type);material(m,type);}
  });
 }
 const clone=g.art.clone.bind(g.art);g.art.clone=function(kind,...args){const root=clone(kind,...args);items(root,kind);return root;};
 function refresh(){
  // Elevator can publish new targets before the older render wrapper runs.
  // Install its cap attributes first, including late worker-created loads.
  g.contactVolume?.refresh();
  for(const e of g.targets||[])items(e.root,e.kind);
  g.scene.traverse(o=>{if(o.isInstancedMesh&&geometryPairs.has(o.geometry))o.geometry=geometryPairs.get(o.geometry);});
  g.graphics.shadowDirty=true;
 }
 g.addEventListener('level',()=>queueMicrotask(refresh));let generation=-1,count=-1;const render=g.render;
 g.render=function(...args){if(generation!==g.generation||count!==g.targets.length){generation=g.generation;count=g.targets.length;refresh();}return render.apply(this,args);};
 const api=g.formReadability={set(value){enabled=!!value;amount.value=enabled?1:0;g.graphics.shadowDirty=true;g.renderer.shadowMap.needsUpdate=true;},get enabled(){return enabled;},refresh,inspect(){
  const changed=[...protectedMaterials].filter(([m,p])=>signature(m)!==p.signature).map(([m,p])=>({name:m.name,kind:p.kind}));
  return{enabled,...metrics,extraTriangles:0,extraDrawPasses:0,extraShadowSamples:0,protectedCount:protectedMaterials.size,protectedMaterialsUnchanged:!changed.length,protectedChanges:changed};
 }};refresh();return api;
}
installFormReadability(window.SMASH);

