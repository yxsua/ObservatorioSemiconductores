import { z } from 'zod';
export const ASSESSMENT_VERSION = '2026-07-21';
const points = (count:number,min:number,max:number) => z.array(z.number().int().min(min).max(max)).length(count);
export const signalAssessmentSchema=z.object({version:z.literal(ASSESSMENT_VERSION),impact:points(5,0,2),urgency:points(5,0,2),reliability:z.array(z.enum(['YES','NO','NA'])).length(19)}).refine(v=>v.reliability.some(x=>x!=='NA'),'Debe haber al menos un criterio aplicable.');
export const alertAssessmentSchema=z.object({version:z.literal(ASSESSMENT_VERSION),impact:points(4,1,5),urgency:points(4,1,5)});
export type SignalAssessment=z.infer<typeof signalAssessmentSchema>;
export type AlertAssessment=z.infer<typeof alertAssessmentSchema>;
export interface Criterion {label:string;help:string;weight?:number;section?:string}
export interface Methodology {version:string;signal:{impact:Criterion[];urgency:Criterion[];reliability:Criterion[]};alert:{impact:Criterion[];urgency:Criterion[];impactScale:Criterion[];urgencyScale:Criterion[]}}
export type Assessment=SignalAssessment|AlertAssessment;
const sum=(values:number[])=>values.reduce((a,b)=>a+b,0);
const level=(total:number,low:number,medium:number)=>total<=low?1:total<=medium?2:3;
export const LEVEL_NAMES=['Sin evaluar','Bajo','Medio','Alto'];
export function assessmentSummary(kind:'signal'|'alert',value:Assessment,methodology:Methodology){
 const impact=sum(value.impact),urgency=sum(value.urgency);
 const impactLevel=level(impact,kind==='signal'?3:8,kind==='signal'?7:14);
 const urgencyLevel=level(urgency,kind==='signal'?3:8,kind==='signal'?7:14);
 if(kind==='alert')return {impact,urgency,impactLevel,urgencyLevel,final:[['Verde','Verde','Amarilla'],['Verde','Amarilla','Naranja'],['Amarilla','Naranja','Roja']][impactLevel-1][urgencyLevel-1]};
 const answers=(value as SignalAssessment).reliability;
 const maximum=answers.reduce((n,v,i)=>n+(v!=='NA'?(methodology.signal.reliability[i].weight??0):0),0);
 const obtained=answers.reduce((n,v,i)=>n+(v==='YES'?(methodology.signal.reliability[i].weight??0):0),0);
 const percent=maximum?100*obtained/maximum:0;
 const reliabilityLevel=percent<50?1:percent<75?2:3;
 return {impact,urgency,impactLevel,urgencyLevel,maximum,obtained,percent,reliabilityLevel,final:`IPS ${impactLevel*urgencyLevel*reliabilityLevel}/27`};
}
