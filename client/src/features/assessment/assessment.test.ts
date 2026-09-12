import {expect,it} from 'vitest';
import {assessmentSummary,signalAssessmentSchema} from './assessment';
import {evaluateTrend} from './trend-assessment';
import methodology from '../../../../backend/src/domain/assessment-methodology.json';
it('calcula cero como respuesta válida y excluye no aplicables',()=>{
 const value={version:'2026-07-21' as const,impact:[0,0,0,0,0],urgency:[2,2,2,2,2],reliability:Array<'YES'|'NO'|'NA'>(19).fill('NA')};value.reliability[0]='YES';value.reliability[1]='NO';
 expect(signalAssessmentSchema.safeParse(value).success).toBe(true);
 expect(assessmentSummary('signal',value,methodology)).toMatchObject({impactLevel:1,urgencyLevel:3,percent:40,final:'IPS 3/27'});
});
it('la madurez exige antigüedad además de señales y fuentes',()=>{
 const signals=Array.from({length:8},(_,i)=>({id:i,publicationDate:'2026-08-01',captureDate:'2026-08-01',source:{id:i}}));
 const value={version:'2026-07-21' as const,nature:'RADICAL' as const};
 expect(evaluateTrend(value,signals,new Date('2026-09-11'))).toMatchObject({maturity:'Evidencia insuficiente',direction:'Disrupción'});
 signals[0].publicationDate='2024-08-01';
 expect(evaluateTrend(value,signals,new Date('2026-09-11')).maturity).toBe('Consolidada');
});
