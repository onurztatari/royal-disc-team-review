// Stage 19: presentation only. Worker, disc radius, mass, speed and cooldowns
// remain owned by the existing game. The supplied v70 rounded disc is retained.
function installGameplayPolish(g){
 if(g.gameplayPolish)return g.gameplayPolish;
 const host=g.canvas.closest('#game'),V=g.camera.position.constructor;
 const css=`
 #game #level-pill{display:none!important}
 #game.rd-gameplay-polish #hud{--power-size:clamp(54px,17.4cqw,72px);--power-inset:max(6px,1.8cqw);--power-gap:7px;--power-bottom:max(5.5%,calc(env(safe-area-inset-bottom) + 16px))}
 #game.rd-gameplay-polish #rdBoosters,#game.rd-gameplay-polish #rdSuperTop{top:auto;transform:none;width:var(--power-size)}
 #game.rd-gameplay-polish #rdBoosters{right:var(--power-inset);left:auto;bottom:var(--power-bottom);height:calc(2 * var(--power-size) + var(--power-gap));gap:var(--power-gap)}
 #game.rd-gameplay-polish #rdSuperTop{left:var(--power-inset);right:auto;bottom:calc(var(--power-bottom) - 14px);height:calc(var(--power-size) + 14px)}
 #game.rd-gameplay-polish #rdSuperTop button.power{min-height:0}
 #game.rd-gameplay-polish #rdBoosters button{min-width:44px;min-height:44px}
 #game.rd-gameplay-polish #rdBoosters .booster-stock{font-size:11px}
 #game.rd-gameplay-polish #rdLiftFloors{top:calc(var(--lift-header-center,90px) - clamp(30px,8.5cqw,36px) / 2);right:auto;left:calc(50% - clamp(30px,8.5cqw,36px) / 2);bottom:auto;transform:none;display:grid;place-items:center;width:clamp(30px,8.5cqw,36px);height:clamp(30px,8.5cqw,36px);min-width:0;padding:0;gap:0;border-radius:50%;border:1.5px solid #ffedb2;background:radial-gradient(circle at 35% 22%,#4998d2,#1a548e 72%);box-shadow:0 0 0 1.5px #bd882b,0 2px 3px #14335a70,inset 0 1px #ffffff60;font-family:'RF Display',sans-serif;pointer-events:none}
 #game.rd-gameplay-polish #rdLiftFloors strong{font-size:clamp(16px,4.8cqw,20px);font-family:'RF Display',sans-serif;line-height:1;min-width:0;text-shadow:0 1px #13375e}
 #game.rd-gameplay-polish #rdLiftFloors[data-phase=empty]{opacity:.58;filter:saturate(.35)}
 #game.rd-gameplay-polish #rdLiftFloors[data-phase=rising],#game.rd-gameplay-polish #rdLiftFloors[data-phase=latching]{box-shadow:0 0 0 1.5px #dfaa46,0 2px 3px #14335a70,0 0 9px #ffdf8470;animation:rd-lift-arriving .9s ease-in-out infinite alternate}
 `;
 const style=document.createElement('style');style.id='rd-gameplay-polish';style.textContent=css;document.head.append(style);
 let enabled=true;const badges=new WeakMap();
 function alignBadge(){const pause=document.getElementById('pause');if(!pause)return;const a=pause.getBoundingClientRect(),b=host.getBoundingClientRect();host.style.setProperty('--lift-header-center',(a.top-b.top+a.height/2)+'px');}
 function compactBadge(){alignBadge();const root=document.getElementById('rdLiftFloors');if(!root)return;
  let saved=badges.get(root);if(!saved){const count=root.querySelector('strong');if(!count)return;saved={nodes:[...root.childNodes],count,parent:count.parentNode};badges.set(root,saved);}
  if(enabled){if(root.childNodes.length!==1||root.firstChild!==saved.count)root.replaceChildren(saved.count);}
  else if(root.firstChild===saved.count){root.replaceChildren(...saved.nodes);saved.parent.append(saved.count);}
 }
 function localBounds(root){root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(),lo=new V(Infinity,Infinity,Infinity),hi=new V(-Infinity,-Infinity,-Infinity);
  root.traverse(o=>{if(!o.isMesh||!o.geometry)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
   for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new V(x,y,z).applyMatrix4(o.matrixWorld).applyMatrix4(inv);lo.min(p);hi.max(p);}
  });return {min:lo,max:hi};
 }
 function setShell(shell){const amount=enabled?1.35:1;shell.scale.y=amount;shell.position.y=shell.userData.restBottom*(1-amount);}
 function roundDisc(root){if(!root||root.userData.roundedDisc19)return root;const b=localBounds(root);if(!Number.isFinite(b.min.y))return root;
  const shell=new root.constructor();shell.name='Rounded artist disc — full body';shell.userData.roundedDiscShell19=true;shell.userData.restBottom=b.min.y;
  for(const child of [...root.children])shell.add(child);root.add(shell);root.userData.roundedDisc19={originalBounds:{min:b.min.toArray(),max:b.max.toArray()},heightRatio:1.35,physicalScaleUnchanged:true};setShell(shell);return root;
 }
 const clone=g.art.clone.bind(g.art);g.art.clone=function(kind,...args){const root=clone(kind,...args);return kind==='disc'||kind==='discV2'?roundDisc(root):root;};
 roundDisc(g.readyDisc);for(const d of g.discs||[])roundDisc(d.root);
 function refresh(){host.classList.toggle('rd-gameplay-polish',enabled);compactBadge();g.scene.traverse(o=>{if(o.userData.roundedDiscShell19)setShell(o);});}
 const headerObserver=new ResizeObserver(alignBadge);headerObserver.observe(host);const pause=document.getElementById('pause');if(pause)headerObserver.observe(pause);
 const hud=document.getElementById('hud');const observer=new MutationObserver(compactBadge);observer.observe(hud||host,hud?{childList:true}:{childList:true,subtree:true});
 const onLevel=()=>queueMicrotask(refresh);g.addEventListener('level',onLevel);
 const api=g.gameplayPolish={set(value){enabled=!!value;refresh();},get enabled(){return enabled;},inspect(){
  const rect=id=>{const e=document.getElementById(id),b=e?.getBoundingClientRect();return b?{x:b.x,y:b.y,width:b.width,height:b.height,visible:getComputedStyle(e).display!=='none'}:null;};
  const bounds=localBounds(g.readyDisc);return {enabled,disc:g.readyDisc.userData.roundedDisc19,displayBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},rootScale:g.readyDisc.scale.toArray(),liveDiscs:g.discs.map(d=>({id:d.id,rounded:!!d.root.userData.roundedDisc19,scale:d.root.scale.toArray(),radius:d.body.discRadius})),normalSpeed:g.config.speed,worker:g.physicsBridge?.loaded,levelLabel:rect('level-pill'),floor:rect('rdLiftFloors'),settings:rect('pause'),floorText:document.getElementById('rdLiftFloors')?.textContent,wand:rect('rdSuperTop'),boosters:rect('rdBoosters')};
 }};refresh();return api;
}

installGameplayPolish(window.SMASH);
