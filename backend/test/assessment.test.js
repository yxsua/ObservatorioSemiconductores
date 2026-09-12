const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateSignal,evaluateAlert,signalAssessmentSchema,methodology}=require('../src/domain/assessment');
const {createSignalSchema,updateSignalSchema}=require('../src/schemas/signal.schema');
const {createAlertSchema}=require('../src/schemas/alert.schema');
const base=()=>({version:'2026-07-21',impact:[0,0,0,0,0],urgency:[0,0,0,0,0],reliability:Array(19).fill('YES')});
test('impacto y urgencia respetan los límites 3/4 y 7/8, incluyendo cero',()=>{
 for(const [points,code] of [[[0,0,0,0,0],'LOW'],[[2,1,0,0,0],'LOW'],[[2,2,0,0,0],'MEDIUM'],[[2,2,2,1,0],'MEDIUM'],[[2,2,2,2,0],'HIGH']]){
  const result=evaluateSignal({...base(),impact:points,urgency:points});assert.equal(result.impactCode,code);assert.equal(result.urgencyCode,code);
 }
});
test('confiabilidad ponderada excluye no aplicables sin confundirlos con incumplimientos',()=>{
 const reliability=Array(19).fill('NA');reliability[0]='YES';reliability[1]='NO';
 const r=evaluateSignal({...base(),reliability});assert.equal(r.reliabilityTotal,2);assert.equal(r.reliabilityMaximum,5);assert.equal(r.reliabilityPercent,40);assert.equal(r.reliabilityCode,'LOW');
 reliability[1]='NA';assert.equal(evaluateSignal({...base(),reliability}).reliabilityPercent,100);
 assert.equal(signalAssessmentSchema.safeParse({...base(),reliability:Array(19).fill('NA')}).success,false);
 assert.equal(methodology.signal.reliability.reduce((s,c)=>s+c.weight,0),40);
});
test('rechaza reactivos incompletos, decimales, valores fuera de escala y versiones ajenas',()=>{
 for(const extra of [{impact:[2,2]},{impact:[2,2,2,2,3]},{urgency:[1,1,1,1,0.5]},{version:'otra'}])assert.equal(signalAssessmentSchema.safeParse({...base(),...extra}).success,false);
});
test('el cliente no puede sustituir niveles calculados ni reenviar alcance',()=>{
 assert.equal(updateSignalSchema.safeParse({impactCode:'HIGH'}).success,false);
 assert.equal(updateSignalSchema.safeParse({scopeCode:'REGIONAL'}).success,false);
 const r=updateSignalSchema.parse({assessment:base()});assert.equal(r.impactCode,'LOW');assert.equal(r.reliabilityCode,'HIGH');
 assert.equal(createSignalSchema.safeParse({assessment:base(),ips:27}).success,false);
 assert.equal(createAlertSchema.safeParse({title:'Alerta',executiveSummary:'Texto',levelCode:'RED',assessment:{version:'2026-07-21',impact:[1,1,1,1],urgency:[1,1,1,1]}}).success,false);
});
test('las nueve combinaciones estratégicas producen el color metodológico de alerta',()=>{
 const totals=[[2,2,2,2],[3,3,4,4],[4,4,4,3]],expected=[['GREEN','GREEN','YELLOW'],['GREEN','YELLOW','ORANGE'],['YELLOW','ORANGE','RED']];
 totals.forEach((impact,i)=>totals.forEach((urgency,j)=>assert.equal(evaluateAlert({version:'2026-07-21',impact,urgency}).levelCode,expected[i][j])));
});
