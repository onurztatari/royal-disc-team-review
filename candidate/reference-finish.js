// Reference pass: directional colour-preserving plastic light and a broader
// rolled can lip. Wood, glass and their source artwork are not patched here.
function installReferenceFinish(g){
 if(g.referenceFinish)return g.referenceFinish;
 let enabled=true;g.referenceGeometry30=true;const amount={value:1},patched=new WeakSet();
 const stats={plasticFaces:0,plasticSides:0,canMaterials:0};
 function patch(m,kind){
  if(patched.has(m))return;patched.add(m);const prior=m.onBeforeCompile,key=m.customProgramCacheKey();stats[kind==='face'?'plasticFaces':kind==='side'?'plasticSides':'canMaterials']++;
  m.onBeforeCompile=function(s,r){prior.call(this,s,r);s.uniforms.royalReference30=amount;if(s.fragmentShader.includes('uniform float royalReference30;'))return;s.fragmentShader='uniform float royalReference30;\n'+s.fragmentShader;
   if(kind==='face'){
    const marker='gl_FragColor.rgb*=mix(1.0,curvedLight26,royalForm26*(1.0-paintedCentre26*.85));';
    if(!s.fragmentShader.includes(marker))throw Error('Reference plastic face contract');
    s.fragmentShader=s.fragmentShader.replace(marker,marker+`
     // Relight the supplied painted face without losing its emblem or alpha.
     float facing30=max(0.0,dot(normal,normalize(vec3(-.48,.65,.80))));
     #if NUM_DIR_LIGHTS > 0
      facing30=max(0.0,dot(normal,normalize(directionalLights[0].direction)));
     #endif
     float faceRoll30=.72+.40*smoothstep(.06,.92,facing30);
     gl_FragColor.rgb*=mix(1.0,faceRoll30,royalReference30*(1.0-paintedCentre26*.45));
    `);
   }else if(kind==='side'){
    s.fragmentShader=s.fragmentShader.replace('#include <colorspace_fragment>',`
     float sideKey30=max(0.0,dot(normal,normalize(vec3(-.48,.65,.80))));
     #if NUM_DIR_LIGHTS > 0
      sideKey30=max(0.0,dot(normal,normalize(directionalLights[0].direction)));
     #endif
     float sideRoll30=.69+.42*smoothstep(.03,.93,sideKey30);
     gl_FragColor.rgb*=mix(1.0,sideRoll30,royalReference30);
     #include <colorspace_fragment>
    `);
   }else{
    const marker='gl_FragColor.rgb*=mix(1.0,lidFinish,lidArea);';
    if(!s.fragmentShader.includes(marker))throw Error('Reference can lid contract');
    s.fragmentShader=s.fragmentShader.replace(marker,`
     // One broad steel bowl and one rolled edge, readable at gameplay size.
     float lip30=smoothstep(.65,.85,lidRadius);
     float rimSeam30=exp(-pow((lidRadius-.70)/.085,2.0));
     float capLight30=.98+.16*lip30-.17*rimSeam30;
     lidFinish=mix(lidFinish,capLight30,royalReference30);
     ${marker}
    `);
   }
  };m.customProgramCacheKey=()=>key.includes(':reference30-')?key:key+':reference30-'+kind;m.needsUpdate=true;
 }
 function visit(root,kind){if(kind!=='can'&&kind!=='plastic')return;root.traverse(o=>{if(!o.isMesh)return;
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(kind==='plastic'){if(m.userData.plasticContactFace)patch(m,'face');else if(m.userData.colourPreservingSatin)patch(m,'side');}
   else if(m.isMeshPhysicalMaterial){patch(m,'can');}
  }
 });}
 const clone=g.art.clone.bind(g.art);g.art.clone=function(kind,...args){const r=clone(kind,...args);visit(r,kind);return r;};
 function refresh(){g.silhouetteProfile?.refresh();for(const e of g.targets||[])visit(e.root,e.kind);g.graphics.shadowDirty=true;g.renderer.shadowMap.needsUpdate=true;}
 let generation=-1,count=-1;const render=g.render;g.render=function(...a){if(generation!==g.generation||count!==g.targets.length){generation=g.generation;count=g.targets.length;refresh();}return render.apply(this,a);};g.addEventListener('level',()=>queueMicrotask(refresh));
 const api=g.referenceFinish={set(v){enabled=!!v;g.referenceGeometry30=enabled;amount.value=enabled?1:0;refresh();},refresh,inspect(){return {enabled,...stats,extraTriangles:0,extraDrawPasses:0,woodGlassArtworkUnchanged:g.formReadability.inspect().protectedMaterialsUnchanged};}};
 refresh();return api;
}

installReferenceFinish(window.SMASH);
