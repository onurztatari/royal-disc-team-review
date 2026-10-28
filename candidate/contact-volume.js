// Stage 25: render-only contact and volume. Stage 24 remains the Before state.
function installContactVolume(g){
 if(g.contactVolume)return g.contactVolume;
 const amount={value:1},patched=new WeakSet(),sidePairs=new Map(),reverse=new Map(),caps=new WeakMap(),protectedMaterials=new Map();
 let enabled=true,compiled=0,capVariants=0,capTriangles=0,groundCount=0;
 const reviewScenes=new Set(),contactLimit=g.performanceQuality?.inspect().mobile?20:32;
 const footprints=Array.from({length:contactLimit},()=>({x:0,y:0,z:0,w:0,toArray(a,o=0){a[o]=this.x;a[o+1]=this.y;a[o+2]=this.z;a[o+3]=this.w;return a;}}));
 const footprintFrames=footprints.map(()=>({x:1,y:0,z:0,w:0,toArray(a,o=0){a[o]=this.x;a[o+1]=this.y;a[o+2]=this.z;a[o+3]=this.w;return a;}}));
 const footprintCount={value:0};
 function updateFootprints(){let n=0;
  for(const e of g.targets||[]){if(n>=contactLimit)break;if(e.removed||e.cleared||!e.root.visible||!e.body)continue;
   const p=e.body.position,q=e.body.quaternion,{x,y,z,w}=q,scale=e.scale||1,h=[(e.length??e.size+1)*.49*scale,.49*scale,.49*scale];
   const R=[[1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w)],[2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w)],[2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y)]];
   const vertical=R.reduce((a,v,i)=>a+Math.abs(v[1])*h[i],0),bottom=p.y-vertical;if(bottom<-.10||bottom>.42)continue;
   const axis=Math.abs(R[0][1])<.7?R[0]:R[2],norm=Math.hypot(axis[0],axis[2])||1,c=axis[0]/norm,t=axis[2]/norm;
   const hx=R.reduce((a,v,i)=>a+Math.abs(c*v[0]+t*v[2])*h[i],0),hz=R.reduce((a,v,i)=>a+Math.abs(-t*v[0]+c*v[2])*h[i],0);
   Object.assign(footprints[n],{x:p.x,y:p.z,z:hx,w:hz});Object.assign(footprintFrames[n],{x:c,y:t,z:Math.max(0,1-Math.max(0,bottom-.03)/.39),w:0});n++;
  }footprintCount.value=n;
 }

 const each=(root,fn)=>root?.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)fn(m,o);});
 const signature=m=>JSON.stringify({color:m.color?.getHex(),map:m.map?.uuid,normalMap:m.normalMap?.uuid,roughness:m.roughness,metalness:m.metalness,clearcoat:m.clearcoat,opacity:m.opacity,shader:String(m.onBeforeCompile),key:m.customProgramCacheKey()});
 function protect(root,kind){if(kind==='wood'||kind==='glass')each(root,m=>{if(!protectedMaterials.has(m))protectedMaterials.set(m,{kind,signature:signature(m)});});}
 const contactLights="\nvec3 geometryPosition = - vViewPosition;\nvec3 geometryNormal = normal;\nvec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\nvec3 geometryClearcoatNormal = vec3( 0.0 );\n#ifdef USE_CLEARCOAT\n\tgeometryClearcoatNormal = clearcoatNormal;\n#endif\n#ifdef USE_IRIDESCENCE\n\tfloat dotNVi = saturate( dot( normal, geometryViewDir ) );\n\tif ( material.iridescenceThickness == 0.0 ) {\n\t\tmaterial.iridescence = 0.0;\n\t} else {\n\t\tmaterial.iridescence = saturate( material.iridescence );\n\t}\n\tif ( material.iridescence > 0.0 ) {\n\t\tmaterial.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );\n\t\tmaterial.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );\n\t}\n#endif\nIncidentLight directLight;\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n\tPointLight pointLight;\n\t#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n\tPointLightShadow pointLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tpointLight = pointLights[ i ];\n\t\tgetPointLightInfo( pointLight, geometryPosition, directLight );\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )\n\t\tpointLightShadow = pointLightShadows[ i ];\n\t\tdirectLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n\tSpotLight spotLight;\n\tvec4 spotColor;\n\tvec3 spotLightCoord;\n\tbool inSpotLightMap;\n\t#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0\n\tSpotLightShadow spotLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tspotLight = spotLights[ i ];\n\t\tgetSpotLightInfo( spotLight, geometryPosition, directLight );\n\t\t#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n\t\t#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX\n\t\t#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n\t\t#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS\n\t\t#else\n\t\t#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n\t\t#endif\n\t\t#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )\n\t\t\tspotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;\n\t\t\tinSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );\n\t\t\tspotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );\n\t\t\tdirectLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;\n\t\t#endif\n\t\t#undef SPOT_LIGHT_MAP_INDEX\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n\t\tspotLightShadow = spotLightShadows[ i ];\n\t\tdirectLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n\tDirectionalLight directionalLight;\n\t#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n\tDirectionalLightShadow directionalLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tdirectionalLight = directionalLights[ i ];\n\t\tgetDirectionalLightInfo( directionalLight, directLight );\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )\n\t\tdirectionalLightShadow = directionalLightShadows[ i ];\n\t\tfloat key25=( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0; contactVisibility25=min(contactVisibility25,key25);directLight.color*=key25;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n\tRectAreaLight rectAreaLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n\t\trectAreaLight = rectAreaLights[ i ];\n\t\tRE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if defined( RE_IndirectDiffuse )\n\tvec3 iblIrradiance = vec3( 0.0 );\n\tvec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n\t#if defined( USE_LIGHT_PROBES )\n\t\tirradiance += getLightProbeIrradiance( lightProbe, geometryNormal );\n\t#endif\n\t#if ( NUM_HEMI_LIGHTS > 0 )\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\t\t\tirradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );\n\t\t}\n\t\t#pragma unroll_loop_end\n\t#endif\n#endif\n#if defined( RE_IndirectSpecular )\n\tvec3 radiance = vec3( 0.0 );\n\tvec3 clearcoatRadiance = vec3( 0.0 );\n#endif";
 function patch(m,kind){
  if(patched.has(m)||protectedMaterials.has(m))return;
  if(kind==='ground'&&!m.userData.presence20)return;
  if(kind==='contact'&&(!m.isMeshBasicMaterial||m.map!==g.shadowTexture))return;
  patched.add(m);if(kind==='ground')groundCount++;
  const previous=m.onBeforeCompile,key=m.customProgramCacheKey();
  m.onBeforeCompile=function(shader,renderer){
   previous.call(this,shader,renderer);if(shader.fragmentShader.includes('uniform float royalContactVolume25;'))return;
   compiled++;shader.uniforms.royalContactVolume25=amount;
   shader.fragmentShader='uniform float royalContactVolume25;\n'+shader.fragmentShader;
   shader.vertexShader='uniform float royalContactVolume25;\n'+shader.vertexShader;
   if(kind==='contact'){
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`#include <alphamap_fragment>
     float core25=1.0-smoothstep(.12,.72,length(vMapUv-vec2(.5))*2.0);
     diffuseColor.a*=mix(1.0,1.18+.42*core25,royalContactVolume25);
    `);return;
   }
   // Use the existing shadow lookup, with a compact weighted penumbra. The
   // existing wood/glass shaders and global sun settings remain untouched.
   if(shader.fragmentShader.includes('float royalSoftShadow')){
    shader.fragmentShader=shader.fragmentShader.replace('vec2 spread=vec2(radius)/size;','vec2 spread=vec2(radius)*mix(1.0,.42,royalContactVolume25)/size;');
    shader.fragmentShader=shader.fragmentShader.replace(/return mix\(1\.0,sum\/([^,]+),([^;]+)\);/,(all,total,strength)=>`return mix(1.0,sum/${total},mix(${strength},min(.84,(${strength})*1.20),royalContactVolume25));`);
   }
   let visibility='royalKeyVisibility';
   if(!shader.fragmentShader.includes('float royalKeyVisibility')){
    if(shader.fragmentShader.includes('#include <lights_fragment_begin>')){
     shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>','float contactVisibility25=1.0;\n'+contactLights);
     visibility='contactVisibility25';
    }else visibility=null;
   }
   if(visibility){
    const gain=kind==='ground'?'.25':kind==='plastic-face'?'.44':'.28';
    shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`
     // Apply real occlusion after artwork retention. Uncovered emblems retain
     // their original pixels; shaded contact faces are no longer self-lit.
     gl_FragColor.rgb*=1.0-(1.0-${visibility})*${gain}*royalContactVolume25;
     #include <colorspace_fragment>
    `);
   }
   if(kind==='ground'&&(m.isMeshStandardMaterial||m.isMeshLambertMaterial)){
    shader.uniforms.contactFootprints25={value:footprints};shader.uniforms.contactFrames25={value:footprintFrames};shader.uniforms.contactCount25=footprintCount;
    shader.vertexShader='varying vec3 contactWorld25;\nvarying vec3 contactWorldNormal25;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ncontactWorld25=(modelMatrix*vec4(transformed,1.0)).xyz;contactWorldNormal25=mat3(modelMatrix)*objectNormal;');
    shader.fragmentShader=`varying vec3 contactWorld25;
     varying vec3 contactWorldNormal25;
     uniform vec4 contactFootprints25[${contactLimit}];uniform vec4 contactFrames25[${contactLimit}];uniform int contactCount25;
    `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`
     float receiver25=smoothstep(.65,.95,normalize(contactWorldNormal25).y)*(1.0-smoothstep(.07,.18,abs(contactWorld25.y-.025)));
     float floorOcclusion25=0.0;
     if(royalContactVolume25>.01&&receiver25>.01){for(int i=0;i<${contactLimit};i++){if(i>=contactCount25)break;
      vec4 foot=contactFootprints25[i],basis=contactFrames25[i];vec2 d=contactWorld25.xz-foot.xy;
      vec2 local=vec2(dot(d,basis.xy),dot(d,vec2(-basis.y,basis.x)));
      float edgeDistance=length(max(abs(local)-foot.zw+vec2(.025),vec2(0.0)));
      float contact=(1.0-smoothstep(.01,.24,edgeDistance))*basis.z;
      floorOcclusion25=max(floorOcclusion25,contact);
     }}
     gl_FragColor.rgb*=1.0-.34*floorOcclusion25*receiver25*royalContactVolume25;
     #include <colorspace_fragment>
    `);
   }
   if(kind==='plastic-side'){
    shader.fragmentShader=shader.fragmentShader.replace('finishedSatin=mix(finishedSatin,fullSide,royalSurfaceFinish);',`
     float shoulder25=.84+.24*exp(-pow((satinAcross-.5)/.70,2.0))+.055*softSideSheen;
     fullSide=mix(fullSide,shoulder25,royalContactVolume25);
     finishedSatin=mix(finishedSatin,fullSide,royalSurfaceFinish);
    `);
   }
   if(kind==='can'){
    shader.vertexShader='attribute vec3 capDelta25;\nattribute vec3 capNormal25;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=normalize(mix(objectNormal,capNormal25,royalContactVolume25));');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=capDelta25*royalContactVolume25;');
    shader.fragmentShader=shader.fragmentShader.replace('vec3 surfaceBend=surfaceLidRadialView*surfaceCurve*surfaceCap;', 'vec3 surfaceBend=surfaceLidRadialView*surfaceCurve*surfaceCap*(1.0-royalContactVolume25);');
    shader.fragmentShader=shader.fragmentShader.replace('lidFinish=mix(lidFinish,pressedFinish,royalSurfaceFinish);',`
     float pressedCentre25=1.0-smoothstep(.58,.90,lidRadius);
     pressedFinish*=mix(1.0,1.0-.10*pressedCentre25,royalContactVolume25);
     lidFinish=mix(lidFinish,pressedFinish,royalSurfaceFinish);
    `);
   }
  };
  m.customProgramCacheKey=()=>key+':contact-volume25-'+kind;m.needsUpdate=true;
 }
 function capGeometry(source){
  if(source.userData.contactVolume25&&source.attributes.capDelta25)return source;
  if(caps.has(source))return caps.get(source);
  source.computeBoundingBox();const b=source.boundingBox,cy=(b.min.y+b.max.y)/2,cz=(b.min.z+b.max.z)/2,ry=(b.max.y-b.min.y)/2,rz=(b.max.z-b.min.z)/2;
  const geo=source.index?source.toNonIndexed():source.clone(),attrs=geo.attributes,fields=Object.keys(attrs).filter(k=>!k.startsWith('cap')),data=Object.fromEntries(fields.map(k=>[k,[]])),delta=[],normals=[];
  let subdivided=0;const oldCount=attrs.position.count;
  const vertex=i=>Object.fromEntries(fields.map(k=>{const a=attrs[k];return[k,Array.from({length:a.itemSize},(_,j)=>a.array[i*a.itemSize+j])];}));
  const midpoint=(a,b)=>Object.fromEntries(fields.map(k=>[k,a[k].map((x,i)=>(x+b[k][i])/2)]));
  function emit(a,b,c,isCap,depth){
   if(isCap&&depth){const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);emit(a,ab,ca,true,depth-1);emit(ab,b,bc,true,depth-1);emit(ca,bc,c,true,depth-1);emit(ab,bc,ca,true,depth-1);return;}
   for(const v of[a,b,c]){
    for(const key of fields)data[key].push(...v[key]);
    const [x,y,z]=v.position,n=v.normal,sign=Math.sign(n[0]),u=(y-cy)/ry,w=(z-cz)/rz,r=Math.hypot(u,w),t=Math.max(0,Math.min(1,(r-.58)/.37));
    const d=Math.min(.045,Math.min(ry,rz)*.095),s=t*t*(3-2*t),slope=(t>0&&t<1?6*t*(1-t)/.37:0)*d;
    if(isCap){delta.push(-sign*d*(1-s),0,0);const ny=r>1e-6?-slope*u/(r*ry):0,nz=r>1e-6?-slope*w/(r*rz):0,len=Math.hypot(1,ny,nz);normals.push(sign/len,ny/len,nz/len);}
    else {delta.push(0,0,0);normals.push(...n);}
   }
  }
  for(let i=0;i<attrs.position.count;i+=3){const v=[vertex(i),vertex(i+1),vertex(i+2)];const isCap=v.every(p=>Math.abs(p.normal[0])>.985)&&v.every(p=>Math.sign(p.normal[0])===Math.sign(v[0].normal[0]));if(isCap)subdivided++;emit(...v,isCap,isCap?2:0);}
  if(subdivided){
   for(const key of fields)geo.setAttribute(key,new attrs[key].constructor(new attrs[key].array.constructor(data[key]),attrs[key].itemSize,attrs[key].normalized));
   const Attribute=attrs.position.constructor;geo.setAttribute('capDelta25',new Attribute(new Float32Array(delta),3));geo.setAttribute('capNormal25',new Attribute(new Float32Array(normals),3));
   geo.computeBoundingBox();geo.computeBoundingSphere();capVariants++;capTriangles+=(geo.attributes.position.count-oldCount)/3;
  }else{const A=attrs.position.constructor;geo.setAttribute('capDelta25',new A(new Float32Array(attrs.position.count*3),3));geo.setAttribute('capNormal25',attrs.normal.clone());}
  geo.userData={...source.userData,contactVolume25:true};caps.set(source,geo);caps.set(geo,geo);return geo;
 }
 function sideMaterial(old){
  if(sidePairs.has(old))return sidePairs.get(old);
  const physical=[...g.graphics.cache.values()].find(m=>m.isMeshPhysicalMaterial);if(!physical)return old;
  const m=new physical.constructor({name:old.name+' · rounded satin',color:old.color.clone(),roughness:.43,metalness:0,clearcoat:.08,clearcoatRoughness:.58,envMap:g.graphics.environment,envMapIntensity:.10,specularColor:old.color.clone(),specularIntensity:.32});
  m.userData={...old.userData,volumeSideSource:old.uuid};m.onBeforeCompile=old.onBeforeCompile;m.customProgramCacheKey=()=>old.customProgramCacheKey()+':physical-side25';
  patch(m,'plastic-side');sidePairs.set(old,m);reverse.set(m,old);return m;
 }
 function items(root,kind){
  protect(root,kind);
  if(kind==='can')each(root,(m,o)=>{if(!m.isMeshPhysicalMaterial)return;o.geometry=capGeometry(o.geometry);patch(m,'can');});
  if(kind==='plastic')root.traverse(o=>{if(!o.isMesh)return;const replace=m=>{if(m.userData.colourPreservingSatin){if(reverse.has(m))return enabled?m:reverse.get(m);const n=sideMaterial(m);return enabled?n:m;}if(m.userData.plasticContactFace)patch(m,'plastic-face');return m;};o.material=Array.isArray(o.material)?o.material.map(replace):replace(o.material);});
 }
 const clone=g.art.clone.bind(g.art);g.art.clone=function(kind,...args){const root=clone(kind,...args);items(root,kind);return root;};
 function refresh(){
  for(const e of g.targets||[]){items(e.root,e.kind);each(e.shadow,m=>patch(m,'contact'));}
  for(const root of[g.platform,g.deckShadow,g.arenaView?.board,g.arenaView?.deck,g.arenaView?.circleShadow])each(root,m=>patch(m,'ground'));
  // Existing opaque instancing shares the original material/geometry. Replace
  // the visual references in the batches as well, never their world matrices.
  for(const scene of[g.scene,...reviewScenes])scene.traverse(o=>{if(!o.isMesh)return;if(o.isInstancedMesh&&caps.has(o.geometry))o.geometry=caps.get(o.geometry);if(sidePairs.has(o.material)&&enabled)o.material=sidePairs.get(o.material);else if(reverse.has(o.material)&&!enabled)o.material=reverse.get(o.material);});
  g.graphics.shadowDirty=true;
 }
 g.addEventListener('level',()=>queueMicrotask(refresh));let length=-1,generation=-1;const render=g.render;
 g.render=function(...args){if(length!==g.targets.length||generation!==g.generation){length=g.targets.length;generation=g.generation;refresh();}updateFootprints();return render.apply(this,args);};
 const api=g.contactVolume={set(on){enabled=!!on;amount.value=enabled?1:0;refresh();g.renderer.shadowMap.needsUpdate=true;},get enabled(){return enabled;},refresh,registerScene(scene){
  reviewScenes.add(scene);each(scene,m=>{if(!m.userData.colourPreservingSatin||sidePairs.has(m)||reverse.has(m))return;
   if(m.isMeshPhysicalMaterial){const old=[...sidePairs.keys()].find(k=>k.uuid===m.userData.volumeSideSource);if(old){const baseline=old.clone();baseline.onBeforeCompile=old.onBeforeCompile;baseline.customProgramCacheKey=old.customProgramCacheKey;sidePairs.set(baseline,m);reverse.set(m,baseline);}}
   else sideMaterial(m);
  });refresh();
 },inspect(){const changed=[...protectedMaterials].filter(([m,p])=>signature(m)!==p.signature).map(([m,p])=>({name:m.name,kind:p.kind}));return{enabled,compiled,plasticVariants:sidePairs.size,capVariants,addedCapTriangles:capTriangles,groundCount,contactFootprints:footprintCount.value,contactLimit,extraDrawPasses:0,extraShadowSamples:0,protectedCount:protectedMaterials.size,protectedMaterialsUnchanged:!changed.length,protectedChanges:changed};}};
 refresh();return api;
}
installContactVolume(window.SMASH);
