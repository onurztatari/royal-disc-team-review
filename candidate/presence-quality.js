// Render-only review: retain artwork, bodies, transforms, inventory and rules.
function installPresenceQuality(g){
 if(g.presenceQuality)return g.presenceQuality;
 const host=g.canvas.closest('#game'),amount={value:1};let enabled=true,materialCount=0,compiled=0;
 const style=document.createElement('style');style.textContent=`
 #game.rd-gameplay-polish:not(.rd-presence) #rdLiftFloors{top:max(16%,calc(env(safe-area-inset-top) + 100px));right:max(12px,3.3cqw);left:auto}
 `;document.head.append(style);
 // A fixed, weighted disc kernel replaces the square PCF pattern. No random
 // per-frame noise, extra light, blur pass, or change to the source textures.
 const sampleCount=g.performanceQuality?.shadowSamples||25;const taps=Array.from({length:sampleCount-1},(_,i)=>{const radius=Math.sqrt((i+.5)/(sampleCount-1)),a=i*2.399963229728653,w=Math.exp(-2*radius*radius);return{x:Math.cos(a)*radius,y:Math.sin(a)*radius,w};});
 const total=1+taps.reduce((n,p)=>n+p.w,0);
 const kernel=taps.map(p=>`sum+=texture2DCompare(shadowMap,q.xy+vec2(${p.x.toFixed(7)},${p.y.toFixed(7)})*spread,q.z)*${p.w.toFixed(7)};`).join('\n');
 const filter=`
 uniform float royalPresence;
 #ifdef USE_SHADOWMAP
 float royalSoftShadow(sampler2D shadowMap,vec2 size,float intensity,float bias,float radius,vec4 coord){
  if(royalPresence<.5)return getShadow(shadowMap,size,intensity,bias,radius,coord);
  vec3 q=coord.xyz/coord.w;q.z+=bias;
  if(q.x<0.0||q.x>1.0||q.y<0.0||q.y>1.0||q.z>1.0)return 1.0;
  vec2 spread=vec2(radius)/size;
  float sum=texture2DCompare(shadowMap,q.xy,q.z);
  ${kernel}
  return mix(1.0,sum/${total.toFixed(7)},intensity);
 }
 #define getShadow royalSoftShadow
 #endif
 `;
 function apply(root){root?.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(!m||m.userData.presence20||(!m.isMeshStandardMaterial&&!m.isShadowMaterial&&!m.isMeshPhongMaterial&&!m.isMeshLambertMaterial))continue;
  m.userData.presence20=true;materialCount++;const prior=m.onBeforeCompile,key=m.customProgramCacheKey();
  m.onBeforeCompile=function(shader,renderer){prior.call(this,shader,renderer);compiled++;shader.uniforms.royalPresence=amount;shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n'+filter);};
  m.customProgramCacheKey=()=>key+':soft-disc-pcf20';m.needsUpdate=true;
 }});}
 const clone=g.art.clone.bind(g.art);g.art.clone=(...args)=>{const root=clone(...args);apply(root);return root;};
 function shadows(){if(enabled){g.graphics.sun.shadow.radius=25*g.graphics.sun.shadow.mapSize.x/2048;g.graphics.sun.shadow.intensity=.58;}else{g.graphics.sun.shadow.radius=g.compositionFinish?.enabled?6.2:4.2;g.graphics.sun.shadow.intensity=g.compositionFinish?.enabled?.68:.74;}g.graphics.shadowDirty=true;}
 function refresh(){host.classList.toggle('rd-presence',enabled);apply(g.scene);shadows();}
 const onLevel=()=>queueMicrotask(refresh);g.addEventListener('level',onLevel);
 const finish=g.compositionFinish?.set.bind(g.compositionFinish);if(finish)g.compositionFinish.set=(v)=>{finish(v);shadows();};
 const api=g.presenceQuality={set(value){enabled=!!value;amount.value=enabled?1:0;refresh();g.arenaView?.setFraming(enabled?'platform':'before');},get enabled(){return enabled;},inspect(){return{enabled,shadowSamples:sampleCount,shadowRadius:g.graphics.sun.shadow.radius,shadowIntensity:g.graphics.sun.shadow.intensity,patchedMaterials:materialCount,compiledMaterials:compiled,shadowMap:g.graphics.sun.shadow.mapSize.toArray(),shadowCamera:{left:g.graphics.sun.shadow.camera.left,right:g.graphics.sun.shadow.camera.right},normalSpeed:g.config.speed,near:g.camera.near};}};
 refresh();return api;
}

installPresenceQuality(window.SMASH);
