(()=>{
 const g=window.SMASH,base=structuredClone(g.level),n=String(Number(base.testId?.slice(1))),catalog=window.REFERENCE_LAYOUT_DATA,spec=catalog[n];
 if(!spec){g.referenceLayout={set(){},inspect(){return {enabled:false,available:false};}};return;}
 let enabled=false;
 const baselinePoints=g.arenaView.framePoints.map(p=>p.clone()),proto=Object.getPrototypeOf(g.arenaView),priorFit=proto.fit;
 proto.fit=function(...args){const points=this.framePoints;this.framePoints=baselinePoints;try{return priorFit.apply(this,args);}finally{this.framePoints=points;}};
 const centered=pieces=>pieces.map(p=>({...p,z:p.z-3.05}));
 function level(){const result=structuredClone(base);result.referenceDesign30={name:spec.name,sourceReference:spec.sourceReference,intent:spec.intent};result.pieces=centered(spec.pieces);
  if(result.elevator){result.elevator.zones=result.elevator.zones.map((z,i)=>({...z,loads:[centered(spec.pieces),centered(spec.secondLoad||spec.pieces)]}));}
  return result;
 }
 const api=g.referenceLayout={set(v){v=!!v;if(v===enabled)return;enabled=v;g.load(v?level():structuredClone(base));},reload(){g.load(enabled?level():structuredClone(base));},inspect(){return {enabled,name:spec.name,baselineCount:base.pieces.length,count:g.level.pieces.length,glassScale:enabled?Math.max(...spec.pieces.filter(p=>p.kind==='glass').map(p=>p.scale)):1,woodDesignUnchanged:true,lockedCamera:true};}};
})();