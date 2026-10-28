// Stage 24. A reversible material-only pass, after the approved graphics stack.
// No geometry, texture, light, camera, body, or gameplay configuration writes.
function installSurfaceFinish(g){
 if(g.surfaceFinish)return g.surfaceFinish;
 const amount={value:1},patched=new WeakMap(),kinds=new Set(),protectedMaterials=new Map(),counts={plastic:0,can:0,ground:0,contact:0};let enabled=true,compiled=0,repairedGroundClones=0;
 // Three Material.clone copies userData but not onBeforeCompile. Restarted
 // runway pieces can therefore retain presence20 without its shadow callback.
 // Restore the same 13/25-tap baseline only for those receiving surfaces.
 const tapCount=g.performanceQuality?.shadowSamples||25;
 const taps=Array.from({length:tapCount-1},(_,i)=>{const r=Math.sqrt((i+.5)/(tapCount-1)),a=i*2.399963229728653;return{x:Math.cos(a)*r,y:Math.sin(a)*r,w:Math.exp(-2*r*r)};});
 const tapWeight=1+taps.reduce((sum,p)=>sum+p.w,0);
 const fallbackShadow=`
 #ifdef USE_SHADOWMAP
 float royalSoftShadow(sampler2D shadowMap,vec2 size,float intensity,float bias,float radius,vec4 coord){
  vec3 q=coord.xyz/coord.w;q.z+=bias;
  if(q.x<0.0||q.x>1.0||q.y<0.0||q.y>1.0||q.z>1.0)return 1.0;
  vec2 spread=vec2(radius)/size;
  float sum=texture2DCompare(shadowMap,q.xy,q.z);
  ${taps.map(p=>`sum+=texture2DCompare(shadowMap,q.xy+vec2(${p.x.toFixed(7)},${p.y.toFixed(7)})*spread,q.z)*${p.w.toFixed(7)};`).join('\n')}
  return mix(1.0,sum/${tapWeight.toFixed(7)},intensity);
 }
 #define getShadow royalSoftShadow
 #endif
 `;
 const signature=m=>JSON.stringify({name:m.name,type:m.type,color:m.color?.getHex(),map:m.map?.uuid,normalMap:m.normalMap?.uuid,roughness:m.roughness,metalness:m.metalness,clearcoat:m.clearcoat,envMap:m.envMap?.uuid,envMapIntensity:m.envMapIntensity,opacity:m.opacity,shader:String(m.onBeforeCompile),key:m.customProgramCacheKey()});
 const each=(root,fn)=>root?.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)fn(m,o);});
 function protect(root,kind){if(kind!=='wood'&&kind!=='glass')return;each(root,m=>{if(!protectedMaterials.has(m))protectedMaterials.set(m,{kind,signature:signature(m)});});}
 function patch(m,kind){
  if(patched.has(m)||protectedMaterials.has(m))return;
  if(kind==='plastic'&&!m.userData.colourPreservingSatin)return;
  if(kind==='can'&&m.userData.compositionFinish!=='can')return;
  if(kind==='ground'&&!m.userData.presence20)return;
  if(kind==='contact'&&(!m.isMeshBasicMaterial||m.map!==g.shadowTexture))return;
  patched.set(m,kind);kinds.add(kind);counts[kind]++;m.userData.surfaceFinish24=kind;
  const prior=m.onBeforeCompile,key=m.customProgramCacheKey();
  m.onBeforeCompile=function(shader,renderer){
   prior.call(this,shader,renderer);compiled++;shader.uniforms.royalSurfaceFinish=amount;
   if(shader.fragmentShader.includes('uniform float royalSurfaceFinish;'))return;
   shader.fragmentShader='uniform float royalSurfaceFinish;\n'+shader.fragmentShader;
   if(kind==='plastic'){
    const marker='gl_FragColor.rgb*=mix(originalSatin,finishedSatin,royalItemPolish);';
    if(!shader.fragmentShader.includes(marker))throw Error('Surface finish: plastic shader contract changed');
    shader.fragmentShader=shader.fragmentShader.replace(marker,`
     // Saturated, broad shoulder illumination. The supplied front/back image
     // is a separate untouched material; no additive white side reflection.
     float broadSide=exp(-pow((satinAcross-.5)/.62,2.0));
     float softSideSheen=pow(max(0.0,dot(normal,satinHalf)),3.5);
     float fullSide=.86+.22*broadSide+.055*softSideSheen-.025*pow(1.0-satinFacing,1.4);
     finishedSatin=mix(finishedSatin,fullSide,royalSurfaceFinish);
     ${marker}
    `);
   }else if(kind==='can'){
    if(!shader.vertexShader.includes('royalLidPosition')||!shader.fragmentShader.includes('royalCanCap'))throw Error('Surface finish: can shader contract changed');
    shader.vertexShader='varying vec3 surfaceLidRadialView;\n'+shader.vertexShader;
    shader.fragmentShader='varying vec3 surfaceLidRadialView;\n'+shader.fragmentShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
     vec3 surfaceRadial=vec3(0.0,royalLidPosition.x,royalLidPosition.y);
     #ifdef USE_INSTANCING
      surfaceRadial=mat3(instanceMatrix)*surfaceRadial;
     #endif
     surfaceLidRadialView=normalMatrix*surfaceRadial;
     #include <project_vertex>
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`
     float surfaceCap=royalCanCap*royalSurfaceFinish;
     float surfaceRadius=length(royalLidPosition);
     // A shallow pressed-metal curvature in shading only. Both original end
     // caps remain at their exact source positions and share the same finish.
     float surfaceCurve=.36*(1.0-smoothstep(.70,1.0,surfaceRadius));
     vec3 surfaceBend=surfaceLidRadialView*surfaceCurve*surfaceCap;
     normal=normalize(normal+surfaceBend);
     #ifdef USE_CLEARCOAT
      clearcoatNormal=normalize(clearcoatNormal+surfaceBend);
     #endif
     roughnessFactor=mix(roughnessFactor,.27+.09*smoothstep(.66,.97,surfaceRadius),surfaceCap);
     #include <lights_physical_fragment>
    `);
    shader.fragmentShader=shader.fragmentShader.replace('float lidFinish=1.0-.10*lidRim-.035*lidDish;',`
     float lidFinish=1.0-.10*lidRim-.035*lidDish;
     float surfaceCrown=exp(-pow((lidRadius-.42)/.40,2.0));
     float pressedFinish=1.0-.14*lidRim+.055*surfaceCrown;
     lidFinish=mix(lidFinish,pressedFinish,royalSurfaceFinish);
    `);
   }else if(kind==='contact'){
    // Reuse the existing item contact mesh and its height-dependent opacity.
    // A compact dark core fades into the original soft footprint. No new mesh,
    // texture, pass, or per-frame body calculations.
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`#include <alphamap_fragment>
     float contactRadius=length(vMapUv-vec2(.5))*2.0;
     float contactCore=1.0-smoothstep(.30,.88,contactRadius);
     diffuseColor.a*=mix(1.0,1.35+.85*contactCore,royalSurfaceFinish);
    `);
   }else{
    if(!shader.fragmentShader.includes('float royalSoftShadow')){
     shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n'+fallbackShadow);repairedGroundClones++;
    }
    // Redistribute the EXISTING 13/25 taps toward a tighter contact core,
    // retaining outer penumbra taps. No second pass or additional samples.
    shader.fragmentShader=shader.fragmentShader.replace(/vec2\((-?[\d.]+),(-?[\d.]+)\)\*spread/g,(all,x,y)=>{
     const radius=Math.hypot(Number(x),Number(y)),scale=.30+.70*radius*radius;
     return `vec2(${x},${y})*mix(1.0,${scale.toFixed(7)},royalSurfaceFinish)*spread`;
    });
    shader.fragmentShader=shader.fragmentShader.replace(/return mix\(1\.0,sum\/([^,]+),intensity\);/,'return mix(1.0,sum/$1,mix(intensity,min(.72,intensity*1.20),royalSurfaceFinish));');
   }
  };
  m.customProgramCacheKey=()=>key+':surface-finish24-'+kind;m.needsUpdate=true;
 }
 function items(root,kind){protect(root,kind);if(kind==='can'||kind==='plastic')each(root,m=>patch(m,kind));}
 for(const e of g.targets||[])protect(e.root,e.kind);
 const clone=g.art.clone.bind(g.art);g.art.clone=function(kind,...args){const root=clone(kind,...args);items(root,kind);return root;};
 function refresh(){
  for(const e of g.targets||[]){items(e.root,e.kind);each(e.shadow,m=>patch(m,'contact'));}
  // Only receiving surfaces, never the wooden/glass target materials.
  for(const root of[g.platform,g.deckShadow,g.arenaView?.board,g.arenaView?.deck,g.arenaView?.circleShadow])each(root,m=>patch(m,'ground'));
  g.graphics.shadowDirty=true;
 }
 g.addEventListener('level',()=>queueMicrotask(refresh));
 let targetCount=-1,generation=-1;const render=g.render;
 g.render=function(...args){if(targetCount!==g.targets.length||generation!==g.generation){targetCount=g.targets.length;generation=g.generation;refresh();}return render.apply(this,args);};
 const api=g.surfaceFinish={set(on){enabled=!!on;amount.value=enabled?1:0;g.graphics.shadowDirty=true;},get enabled(){return enabled;},refresh,inspect(){
  const changed=[...protectedMaterials].filter(([m,p])=>signature(m)!==p.signature).map(([m,p])=>({name:m.name,kind:p.kind}));
  return{enabled,patched:{...counts},compiled,repairedGroundClones,extraDrawPasses:0,extraShadowSamples:0,protectedCount:protectedMaterials.size,protectedMaterialsUnchanged:changed.length===0,protectedChanges:changed,onlyKinds:[...kinds]};
 }};refresh();return api;
}
installSurfaceFinish(window.SMASH);
