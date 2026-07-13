import { z } from "zod";
import type { components } from "@/api/schema";

export type SignalInput = components["schemas"]["CreateSignalInput"];

function keywords(value: string) {
  return value.split(/[\n,]/).map((keyword) => keyword.trim()).filter(Boolean);
}

const required = (label: string, maximum: number) => z.string().trim()
  .min(1, `${label} es obligatorio.`)
  .max(maximum, `${label} no puede superar ${maximum} caracteres.`);

export const signalFormSchema = z.object({
  title: required("El título", 200),
  summary: required("El resumen", 5000),
  publicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida."),
  evidenceUrl: z.string().trim().min(1, "La URL de evidencia es obligatoria.").max(2000, "La URL no puede superar 2000 caracteres.").url("Escribe una URL completa y válida."),
  categoryId: z.string().min(1, "Selecciona una categoría."),
  sourceId: z.string().min(1, "Selecciona una fuente."),
  signalTypeCode: z.string().min(1, "Selecciona un tipo de señal."),
  impactCode: z.string().min(1, "Selecciona el impacto."),
  urgencyCode: z.string().min(1, "Selecciona la urgencia."),
  reliabilityCode: z.string().min(1, "Selecciona la confiabilidad."),
  scopeCode: z.string().min(1, "Selecciona el alcance."),
  notes: z.string().trim().max(5000, "Las notas no pueden superar 5000 caracteres."),
  keywordsText: z.string().refine((value) => keywords(value).length <= 20, "Puedes registrar hasta 20 palabras clave.").refine((value) => keywords(value).every((keyword) => keyword.length <= 80), "Cada palabra clave puede tener hasta 80 caracteres.")
});

export type SignalFormValues = z.infer<typeof signalFormSchema>;

export function toSignalInput(values: SignalFormValues): SignalInput {
  return {
    title: values.title,
    summary: values.summary,
    publicationDate: values.publicationDate,
    evidenceUrl: values.evidenceUrl,
    categoryId: Number(values.categoryId),
    sourceId: Number(values.sourceId),
    signalTypeCode: values.signalTypeCode,
    impactCode: values.impactCode as SignalInput["impactCode"],
    urgencyCode: values.urgencyCode as SignalInput["urgencyCode"],
    reliabilityCode: values.reliabilityCode as SignalInput["reliabilityCode"],
    scopeCode: values.scopeCode,
    notes: values.notes || null,
    keywords: keywords(values.keywordsText)
  };
}

