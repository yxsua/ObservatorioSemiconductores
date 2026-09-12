const { z } = require('zod');
const methodology = require('./assessment-methodology.json');
const version = z.literal(methodology.version);
const points = (count, min, max) => z.array(z.number().int().min(min).max(max)).length(count);
const signalAssessmentSchema = z.object({
    version, impact: points(5, 0, 2), urgency: points(5, 0, 2),
    reliability: z.array(z.enum(['YES', 'NO', 'NA'])).length(19)
}).strict().refine(v => v.reliability.some(x => x !== 'NA'), 'Debe existir al menos un criterio de confiabilidad aplicable.');
const alertAssessmentSchema = z.object({version, impact: points(4, 1, 5), urgency: points(4, 1, 5)}).strict();
const trendAssessmentSchema = z.object({version, nature: z.enum(['INCREMENTAL', 'RADICAL'])}).strict();
const sum = values => values.reduce((a, b) => a + b, 0);
const level = (total, low, medium) => total <= low ? 'LOW' : total <= medium ? 'MEDIUM' : 'HIGH';
const weight = code => ({LOW:1, MEDIUM:2, HIGH:3})[code];
function evaluateSignal(assessment) {
    const v = signalAssessmentSchema.parse(assessment);
    const impactTotal = sum(v.impact), urgencyTotal = sum(v.urgency);
    const reliabilityTotal = sum(v.reliability.map((value,i) => value === 'YES' ? methodology.signal.reliability[i].weight : 0));
    const reliabilityMaximum = sum(v.reliability.map((value,i) => value !== 'NA' ? methodology.signal.reliability[i].weight : 0));
    const reliabilityPercent = 100 * reliabilityTotal / reliabilityMaximum;
    const impactCode = level(impactTotal,3,7), urgencyCode = level(urgencyTotal,3,7);
    const reliabilityCode = reliabilityPercent < 50 ? 'LOW' : reliabilityPercent < 75 ? 'MEDIUM' : 'HIGH';
    const ips = weight(impactCode)*weight(urgencyCode)*weight(reliabilityCode);
    return {impactTotal,urgencyTotal,reliabilityTotal,reliabilityMaximum,reliabilityPercent,impactCode,urgencyCode,reliabilityCode,ips,priority:level(ips,9,18)};
}
function evaluateAlert(assessment) {
    const v = alertAssessmentSchema.parse(assessment);
    const impactTotal=sum(v.impact),urgencyTotal=sum(v.urgency);
    const impactCode=level(impactTotal,8,14),urgencyCode=level(urgencyTotal,8,14);
    const matrix={LOW:{LOW:'GREEN',MEDIUM:'GREEN',HIGH:'YELLOW'},MEDIUM:{LOW:'GREEN',MEDIUM:'YELLOW',HIGH:'ORANGE'},HIGH:{LOW:'YELLOW',MEDIUM:'ORANGE',HIGH:'RED'}};
    return {impactTotal,urgencyTotal,impactCode,urgencyCode,levelCode:matrix[impactCode][urgencyCode]};
}
module.exports={methodology,signalAssessmentSchema,alertAssessmentSchema,trendAssessmentSchema,evaluateSignal,evaluateAlert};
