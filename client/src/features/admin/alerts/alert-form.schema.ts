import { z } from "zod";

export const alertFormSchema=z.object({
  title:z.string().trim().min(1,"Escribe el título.").max(150),
  executiveSummary:z.string().trim().min(1,"Escribe el resumen ejecutivo.").max(10000),
  implications:z.string().max(10000),recommendations:z.string().max(10000),
  responseDeadline:z.union([z.literal(""),z.iso.date()]),levelCode:z.union([z.literal(""),z.enum(["YELLOW","ORANGE","RED"])]),
  activationRule:z.string().max(5000),notes:z.string().max(5000),
  signalIds:z.array(z.string()),trendIds:z.array(z.string()),audienceCodes:z.array(z.string())
});
export type AlertFormValues=z.infer<typeof alertFormSchema>;
const nullable=(value:string)=>value.trim()||null;
export const toAlertInput=(v:AlertFormValues)=>({title:v.title.trim(),executiveSummary:v.executiveSummary.trim(),implications:nullable(v.implications),recommendations:nullable(v.recommendations),responseDeadline:v.responseDeadline||null,levelCode:v.levelCode||null,activationRule:nullable(v.activationRule),notes:nullable(v.notes),signalIds:v.signalIds.map(Number),trendIds:v.trendIds.map(Number),audienceCodes:v.audienceCodes});
export function alertReadiness(v:AlertFormValues){return [
  {label:"Nivel de alerta asignado",ready:Boolean(v.levelCode)},
  {label:"Implicaciones documentadas",ready:Boolean(v.implications.trim())},
  {label:"Recomendaciones documentadas",ready:Boolean(v.recommendations.trim())},
  {label:"Regla de activación documentada",ready:Boolean(v.activationRule.trim())},
  {label:"Al menos una señal o tendencia",ready:v.signalIds.length+v.trendIds.length>0},
  {label:"Al menos una audiencia",ready:v.audienceCodes.length>0}
]}
