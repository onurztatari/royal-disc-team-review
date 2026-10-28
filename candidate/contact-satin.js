// Presentation-only planar support footprints. No body/world mutation.
function supportSurface(e){
 if(e.removed||e.cleared||e.elevatorRising||!e.root.visible)return null;
 const p=e.body.position,q=e.body.quaternion,{x,y,z,w}=q,scale=e.scale||1,length=e.length??e.size+1;
 const r=[[1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w)],[2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w)],[2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y)]];
 const vertical=r.reduce((best,v,i)=>Math.abs(v[1])>Math.abs(r[best][1])?i:best,0);
 if(Math.abs(r[vertical][1])<.995)return null;
 const speed=Math.hypot(e.body.velocity.x,e.body.velocity.y,e.body.velocity.z),spin=Math.hypot(e.body.angularVelocity.x,e.body.angularVelocity.y,e.body.angularVelocity.z);
 if(speed>.8||spin>1.2)return null;
 const f=e.kind==='can'?.5:e.kind==='glass'?.4925:.49,h=[length*f*scale,f*scale,f*scale];
 const ids=[0,1,2].filter(i=>i!==vertical),a=ids[0],b=ids[1],norm=Math.hypot(r[a][0],r[a][2]);
 const u=[r[a][0]/norm,r[a][2]/norm],v=[-u[1],u[0]],height=r.reduce((s,row,i)=>s+Math.abs(row[1])*h[i],0);
 const circle=vertical===0&&(e.kind==='glass'||e.geometry==='cylinder');
 return {id:e.id,x:p.x,z:p.z,top:p.y+height,bottom:p.y-height,u,v,hx:h[a],hz:h[b],circle,receiver:!circle,strength:Math.max(0,1-speed/.8)*Math.max(0,1-spin/1.2)};
}
function footprint(s,pad=0){
 const point=(x,z)=>[s.x+s.u[0]*x+s.v[0]*z,s.z+s.u[1]*x+s.v[1]*z];
 if(s.circle)return Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return point(Math.cos(a)*(s.hx+pad),Math.sin(a)*(s.hz+pad));});
 return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>point(x*(s.hx+pad),z*(s.hz+pad)));
}
function clipFootprint(subject,clip){
 let output=subject;
 for(let i=0;i<clip.length&&output.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],side=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
  const input=output;output=[];
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],dp=side(p),dq=side(q),ip=dp>=-1e-7,iq=dq>=-1e-7;
   if(ip)output.push(p);
   if(ip!==iq){const t=dp/(dp-dq);output.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
  }
 }
 return output;
}
function areaOf(poly){let a=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];a+=p[0]*q[1]-q[0]*p[1];}return Math.abs(a)/2;}

function installContactSatin(g){
 if(g.contactSatin)return g.contactSatin;
 let contactOn=true,metalOn=true,patchCount=0,canMaterials=0;const contacts={value:1},metal={value:1},patched=new WeakSet(),geometrySeen=new WeakSet();
 const shadowTemplate=g.makeShadow(1,1),maxPatches=40,maxVerts=maxPatches*48,baseGeo=shadowTemplate.geometry,Attribute=baseGeo.attributes.position.constructor;
 const geometry=baseGeo.clone();geometry.setIndex(null);
 const positions=new Float32Array(maxVerts*3),uv=new Float32Array(maxVerts*2),strength=new Float32Array(maxVerts),round=new Float32Array(maxVerts);
 geometry.setAttribute('position',new Attribute(positions,3));geometry.setAttribute('uv',new Attribute(uv,2));geometry.setAttribute('normal',new Attribute(new Float32Array(maxVerts*3),3));geometry.setAttribute('supportStrength31',new Attribute(strength,1));geometry.setAttribute('supportRound31',new Attribute(round,1));geometry.setDrawRange(0,0);
 const material=new shadowTemplate.material.constructor({name:'Soft inter-item contact · stage31',color:0x172134,transparent:true,opacity:.30,depthWrite:false,depthTest:true,toneMapped:false,side:2});
 material.onBeforeCompile=s=>{s.vertexShader='attribute float supportStrength31;attribute float supportRound31;varying vec2 supportUV31;varying float supportAlpha31;varying float supportCircle31;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsupportUV31=uv;supportAlpha31=supportStrength31;supportCircle31=supportRound31;');s.fragmentShader='varying vec2 supportUV31;varying float supportAlpha31;varying float supportCircle31;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <alphamap_fragment>',`#include <alphamap_fragment>
  vec2 edge31=abs(supportUV31-.5)*2.0;
  float distance31=mix(max(edge31.x,edge31.y),length(edge31),supportCircle31);
  diffuseColor.a*=supportAlpha31*(1.0-smoothstep(.70,1.0,distance31));
 `);};material.customProgramCacheKey=()=> 'soft-support31';
 shadowTemplate.material.dispose();const mesh=new shadowTemplate.constructor(geometry,material);mesh.name='Soft contact at real support joints';mesh.frustumCulled=false;mesh.renderOrder=3;g.scene.add(mesh);
 function updateSupports(){
  if(!contactOn){mesh.visible=false;patchCount=0;return;}
  const list=(g.targets||[]).map(supportSurface).filter(Boolean);let cursor=0;patchCount=0;
  for(const lower of list){if(!lower.receiver||lower.top<.12)continue;
   const receiver=footprint(lower,-.025);
   for(const upper of list){
    if(upper.id===lower.id||patchCount>=maxPatches)continue;
    const gap=upper.bottom-lower.top;if(gap<-.035||gap>.10)continue;
    if(Math.hypot(upper.x-lower.x,upper.z-lower.z)>Math.hypot(lower.hx,lower.hz)+Math.hypot(upper.hx,upper.hz)+.13)continue;
    const poly=clipFootprint(footprint(upper,.13),receiver);if(poly.length<3||areaOf(poly)<.025)continue;
    const weight=Math.min(lower.strength,upper.strength)*Math.max(0,1-Math.max(0,gap)/.10);
    const emit=p=>{positions[cursor*3]=p[0];positions[cursor*3+1]=lower.top+.004;positions[cursor*3+2]=p[1];const dx=p[0]-upper.x,dz=p[1]-upper.z;uv[cursor*2]=.5+(dx*upper.u[0]+dz*upper.u[1])/(2*(upper.hx+.13));uv[cursor*2+1]=.5+(dx*upper.v[0]+dz*upper.v[1])/(2*(upper.hz+.13));strength[cursor]=weight;round[cursor]=upper.circle?1:0;cursor++;};
    if(cursor+(poly.length-2)*3>maxVerts)continue;
    for(let i=1;i<poly.length-1;i++){emit(poly[0]);emit(poly[i]);emit(poly[i+1]);}patchCount++;
   }
  }
  geometry.setDrawRange(0,cursor);for(const name of ['position','uv','supportStrength31','supportRound31'])geometry.attributes[name].needsUpdate=true;mesh.visible=cursor>0;
 }
 function canGeometry(o){
  if(geometrySeen.has(o.geometry))return;geometrySeen.add(o.geometry);o.geometry.computeBoundingBox();const box=o.geometry.boundingBox,p=o.geometry.attributes.position,mid=(box.max.x+box.min.x)/2,half=Math.max(.001,(box.max.x-box.min.x)/2),axis=new Float32Array(p.count);
  for(let i=0;i<p.count;i++)axis[i]=Math.abs((p.getX(i)-mid)/half);
  o.geometry.setAttribute('satinAxis31',new p.constructor(axis,1));
 }
 function patch(m,kind){
  if(patched.has(m))return;patched.add(m);if(kind==='can')canMaterials++;
  const prior=m.onBeforeCompile,key=m.customProgramCacheKey();
  m.onBeforeCompile=function(s,r){prior.call(this,s,r);s.uniforms.royalContact31=contacts;s.uniforms.royalSatin31=metal;if(s.fragmentShader.includes('uniform float royalContact31;'))return;
   s.fragmentShader='uniform float royalContact31;uniform float royalSatin31;\n'+s.fragmentShader;
   if(kind==='can'){
    s.vertexShader='attribute float satinAxis31;varying float vSatinAxis31;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSatinAxis31=satinAxis31;');s.fragmentShader='varying float vSatinAxis31;\n'+s.fragmentShader;
    const clean=`
     float gold31=smoothstep(.08,.20,royalArtistPaint.r-royalArtistPaint.b);
     float darkInk31=1.0-smoothstep(.025,.11,max(royalArtistPaint.r,max(royalArtistPaint.g,royalArtistPaint.b)));
     float crownWindow31=(1.0-smoothstep(.205,.24,abs(vMapUv.x-.5)))*(1.0-smoothstep(.08,.115,abs(vMapUv.y-.5)))*(1.0-royalCanCap);
     float crown31=crownWindow31*max(gold31,darkInk31);
     float slimRim31=smoothstep(.915,.955,vSatinAxis31)*(1.0-smoothstep(.972,.995,vSatinAxis31))*(1.0-royalCanCap);
     vec3 cleanSteel31=mix(vec3(.72,.79,.90),vec3(.68,.48,.16),slimRim31*.55)*diffuse;
     diffuseColor.rgb=mix(diffuseColor.rgb,mix(cleanSteel31,royalArtistPaint,crown31),royalSatin31);
     royalInkMask=mix(royalInkMask,crown31,royalSatin31);
    `;
    if(!s.fragmentShader.includes('vec3 royalArtistPaint')||!s.fragmentShader.includes('royalCanCap'))throw Error('Satin can contract changed');
    s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',clean+'\n#include <roughnessmap_fragment>');
    s.fragmentShader=s.fragmentShader.replace('#include <lights_physical_fragment>',`
     float metalArea31=(1.0-royalInkMask)*royalSatin31;
     roughnessFactor=mix(roughnessFactor,mix(.29,.34,royalCanCap),metalArea31);
     metalnessFactor=mix(metalnessFactor,.36,metalArea31);
     #include <lights_physical_fragment>
    `);
   }
   // Existing real shadow visibility attenuates the fill too, only on shaded
   // receivers. No change to the light, camera, or wood/glass shader stack.
   const visibility=s.fragmentShader.includes('float royalKeyVisibility')?'royalKeyVisibility':s.fragmentShader.includes('float contactVisibility25')?'contactVisibility25':null;
   if(visibility)s.fragmentShader=s.fragmentShader.replace('#include <colorspace_fragment>',`gl_FragColor.rgb*=1.0-(1.0-${visibility})*${kind==='ground'?'.12':'.16'}*royalContact31;\n#include <colorspace_fragment>`);
   if(kind==='ground'){
    s.fragmentShader=s.fragmentShader.replace('float contact=(1.0-smoothstep(.01,.24,edgeDistance))*basis.z;',`float contact=mix(1.0-smoothstep(.01,.24,edgeDistance),1.0-smoothstep(.005,.20,edgeDistance),royalContact31)*basis.z;`);
    s.fragmentShader=s.fragmentShader.replace('.34*floorOcclusion25','mix(.34,.40,royalContact31)*floorOcclusion25');
   }
  };m.customProgramCacheKey=()=>key.includes(':contact-satin31')?key:key+':contact-satin31-'+kind;m.needsUpdate=true;
 }
 function items(root,kind){if(kind!=='can'&&kind!=='plastic')return;root.traverse(o=>{if(!o.isMesh)return;if(kind==='can')canGeometry(o);for(const m of Array.isArray(o.material)?o.material:[o.material])if(kind==='can'&&m.isMeshPhysicalMaterial||kind==='plastic'&&(m.userData.plasticContactFace||m.userData.colourPreservingSatin))patch(m,kind);});}
 const clone=g.art.clone.bind(g.art);g.art.clone=function(kind,...args){const root=clone(kind,...args);items(root,kind);return root;};
 function refresh(){g.referenceFinish?.refresh();for(const e of g.targets||[])items(e.root,e.kind);for(const root of [g.platform,g.deckShadow,g.arenaView?.board,g.arenaView?.deck,g.arenaView?.circleShadow])root?.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.userData.presence20)patch(m,'ground');});g.graphics.shadowDirty=true;}
 let generation=-1,count=-1;const render=g.render;g.render=function(...args){if(generation!==g.generation||count!==g.targets.length){generation=g.generation;count=g.targets.length;refresh();}updateSupports();return render.apply(this,args);};g.addEventListener('level',()=>queueMicrotask(refresh));
 const api=g.contactSatin={set(mode){contactOn=mode!=='before';metalOn=mode==='after';contacts.value=+contactOn;metal.value=+metalOn;updateSupports();g.graphics.shadowDirty=true;},inspect(){return{contacts:contactOn,metal:metalOn,patchCount,maxPatches,canMaterials,extraDrawCalls:mesh.visible?1:0,extraTriangles:geometry.drawRange.count/3,protectedArtwork:g.formReadability.inspect().protectedMaterialsUnchanged};}};
 refresh();return api;
}

installContactSatin(window.SMASH);
