// Rendering workload only. No physics, item art or world-scale adjustment.
function installPerformanceQuality(g){
 if(g.performanceQuality)return g.performanceQuality;
 const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&matchMedia('(pointer:coarse)').matches)||new URLSearchParams(location.search).get('quality')==='mobile';
 const shadow=g.graphics.sun.shadow;
 if(mobile){g.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));if(g.ready)g.resize();shadow.map?.dispose();shadow.map=null;shadow.mapSize.set(1024,1024);g.renderer.shadowMap.needsUpdate=true;g.graphics.shadowDirty=true;}
 return g.performanceQuality={mobile,shadowSamples:mobile?13:25,inspect(){return{mobile,pixelRatio:g.renderer.getPixelRatio(),shadowSize:shadow.mapSize.toArray(),renderTarget:60,physicsStep:1/240};}};
}

installPerformanceQuality(window.SMASH);
