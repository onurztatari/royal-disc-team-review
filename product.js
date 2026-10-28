(()=>{'use strict';
const frame=document.querySelector('iframe'),phone=document.querySelector('#phone'),loading=document.querySelector('#loading'),picker=document.querySelector('#picker'),message=document.querySelector('#loading-text'),progress=document.querySelector('#load-progress');
const params=new URLSearchParams(location.search),levels=[33,48,13];let level=levels.includes(+params.get('level'))?+params.get('level'):33,ready=false,timeout,wasPaused=false;
const errors=[];window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>fail(String(e.reason?.message||e.reason)));
function fit(){const s=Math.min(1,innerWidth/390,innerHeight/844);phone.style.width=390*s+'px';phone.style.height=844*s+'px';frame.style.transform=`scale(${s})`;}
window.addEventListener('resize',fit);fit();
function fail(reason){errors.push(reason);loading.hidden=false;message.textContent='The game could not finish loading. Please try again.';document.querySelector('#reload').hidden=false;clearTimeout(timeout);console.error('[Royal Disc]',reason);}
function load(n=level){level=n;ready=false;picker.hidden=true;loading.hidden=false;message.textContent='Preparing your game…';progress.style.width='8%';document.querySelector('#reload').hidden=true;history.replaceState(null,'','?level='+n);try{localStorage.setItem('royal-disc.shell.mechanics.preview.v1',JSON.stringify({revealed:{orbit:true,elevator:true},guided:{orbit:true,elevator:true}}));}catch{}
 clearTimeout(timeout);timeout=setTimeout(()=>fail('Loading timeout'),120000);frame.src=`candidate/review.html?level=${n}&platform=${n===33?'campaign':'orbit'}&lane=wide&product=31`;
}
function showPicker(title='Choose a level',resume=true){if(!ready)return;const g=frame.contentWindow.SMASH;wasPaused=g.paused;g.cancelInput();g.paused=true;g.physicsBridge?.setPaused(true);document.querySelector('#picker-title').textContent=title;document.querySelector('#resume').hidden=!resume||g.status!=='playing';picker.hidden=false;picker.querySelector('[data-level]')?.focus();}
function resume(){if(!ready)return;picker.hidden=true;const w=frame.contentWindow;w.DISC_QA.gameplayFlow.hide();w.__royalDiscBridge.setPaused(false);w.SMASH.physicsBridge?.setPaused(false);}
document.querySelector('#resume').onclick=resume;document.querySelector('#replay').onclick=()=>load();document.querySelector('#reload').onclick=()=>load();document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>load(+b.dataset.level));
window.addEventListener('message',async event=>{
 if(event.source!==frame.contentWindow||event.origin!==location.origin)return;const d=event.data;
 if(d.kind==='product-status'){document.querySelector('#product-status').textContent=JSON.stringify(d);return;}
 if(d.kind==='graphics-loading'){progress.style.width=Math.min(76,10+66*(Number(d.ratio)||0))+'%';return;}
 if(d.kind==='graphics-error'){fail(d.message);return;}
 if(d.kind!=='graphics-ready')return;
 try{
 const w=frame.contentWindow,g=w.SMASH,doc=frame.contentDocument;
 const script=name=>new Promise((resolve,reject)=>{const s=doc.createElement('script');s.src=name;s.onload=resolve;s.onerror=()=>reject(Error('Could not load '+name));doc.body.append(s);});
 const modules=['launcher-review','gameplay-polish','performance-quality','presence-quality','surface-finish','contact-volume','form-readability','model-balance','silhouette-profile','screen-presence','reference-finish'];
 for(let i=0;i<modules.length;i++){await script(modules[i]+'.js');progress.style.width=(77+i)+'%';}
 g.presenceQuality.set(true);g.surfaceFinish.set(true);g.contactVolume.set(true);g.formReadability.set(true);g.modelBalance.set(true);g.silhouetteProfile.set(true);g.screenPresence.set(true);g.referenceFinish.set(true);
 w.REFERENCE_LAYOUT_DATA=await fetch('candidate/reference-layouts.json').then(r=>{if(!r.ok)throw Error('Level data unavailable');return r.json();});await script('reference-layouts.js');g.referenceLayout.set(true);await g.physicsBridge.loadPromise;
 await script('contact-satin.js');g.contactSatin.set('after');message.textContent='Finishing touches…';progress.style.width='93%';
 const warm=g.graphics.warmVariants();try{await g.renderer.compileAsync(g.scene,g.camera);}finally{warm.dispose();}
 w.LAUNCHER_REVIEW.setCamera('close-phone');g.compositionFinish.set(true);g.arenaView.setFraming('platform');
 // Product navigation only; the gameplay/continue/physics implementation stays unchanged.
 const bridge=w.__royalDiscBridge;bridge.openIterationTools=()=>{w.DISC_QA.gameplayFlow.hide();showPicker();};bridge.leaveLevel=()=>showPicker('Choose a level',false);
 const tools=doc.querySelector('.rd-menu-tools');if(tools){tools.setAttribute('aria-label','Choose level');tools.title='Choose level';tools.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>';}
 g.addEventListener('result',({detail})=>{queueMicrotask(()=>showPicker(detail.won?'Level complete!':'Try again',false));});
 w.addEventListener('error',e=>errors.push(e.message));w.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
 ready=true;clearTimeout(timeout);progress.style.width='100%';loading.hidden=true;
 // Read-only status allows packaging QA without adding review controls to gameplay.
 const status=doc.createElement('script');status.src='product-status.js';doc.body.append(status);
 }catch(error){fail(error.message||String(error));}
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!picker.hidden&&!document.querySelector('#resume').hidden)resume();});
load();})();
