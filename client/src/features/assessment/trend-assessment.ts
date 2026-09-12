export interface TrendAssessment {version:'2026-07-21';nature:'INCREMENTAL'|'RADICAL'}
export interface TrendEvidence {id:number;publicationDate:string;captureDate:string;source:{id:number}}
export function evaluateTrend(value:TrendAssessment,signals:TrendEvidence[],now=new Date()){
 const days=signals.map(s=>s.publicationDate.slice(0,10)).sort();
 let months=0;
 if(days.length){const first=new Date(`${days[0]}T00:00:00Z`),last=new Date(`${days.at(-1)}T00:00:00Z`);months=(last.getUTCFullYear()-first.getUTCFullYear())*12+last.getUTCMonth()-first.getUTCMonth()-(last.getUTCDate()<first.getUTCDate()?1:0);}
 const today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
 const age=(s:TrendEvidence)=>(today-Date.parse(`${s.captureDate.slice(0,10)}T00:00:00Z`))/86400000;
 const current=signals.filter(s=>age(s)>=0&&age(s)<30).length,previous=signals.filter(s=>age(s)>=30&&age(s)<60).length;
 const sources=new Set(signals.map(s=>s.source.id)).size;
 const maturity=signals.length>=8&&months>=24&&sources>=5?'Consolidada':signals.length>=5&&months>=12&&sources>=3?'En consolidación':signals.length>=3&&months>=6&&sources>=2?'Emergente':'Evidencia insuficiente';
 const direction=!signals.length?'Sin evidencia':value.nature==='RADICAL'?(current>=previous?'Transformación':'Disrupción'):(current>=previous?'Crecimiento':'Reducción');
 return {months,sources,current,previous,maturity,direction,count:signals.length};
}
