import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "@/api";
import { Button } from "@/components/ui/Button";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { FieldLabel } from "@/components/forms/FieldHelp";
import { useAuth } from "@/features/auth/AuthContext";
import { applyZodErrors } from "@/features/auth/form-errors";
import { getAdminEntity } from "../admin.service";
import { createSignal, getSignalFormOptions, updateSignal } from "./signal-form.service";
import { signalFormSchema, toSignalInput, type SignalFormValues } from "./signal-form.schema";
import type { Signal, SignalFormOption, SignalFormOptions } from "./signal-form.types";
import styles from "./SignalForm.module.css";

const EMPTY_VALUES: SignalFormValues = {
  title: "", summary: "", publicationDate: "", evidenceUrl: "", categoryId: "", sourceId: "",
  signalTypeCode: "", impactCode: "", urgencyCode: "", reliabilityCode: "", scopeCode: "", notes: "", keywordsText: ""
};

const FIELD_HELP: Partial<Record<keyof SignalFormValues, string>> = {
  signalTypeCode: "Clasifica la naturaleza del cambio observado; no sustituye al FCV ni a la categoría temática.", categoryId: "Selecciona la categoría más específica dentro de un Factor Crítico de Vigilancia.", sourceId: "Fuente activa donde se localizó la evidencia; debe permitir trazabilidad.", impactCode: "Valora magnitud, actores afectados, decisiones, alcance y permanencia. Popularidad no equivale a impacto.", urgencyCode: "Mide cuánto tiempo hay antes de perder valor de decisión; actualidad no equivale a urgencia alta.", reliabilityCode: "Considera trazabilidad, autoridad, calidad documental y corroboración.", scopeCode: "Ámbito geográfico o sectorial donde el cambio produce efectos observables."
};

function valuesFromSignal(signal: Signal): SignalFormValues {
  return {
    title: signal.title,
    summary: signal.summary,
    publicationDate: signal.publicationDate,
    evidenceUrl: signal.evidenceUrl,
    categoryId: String(signal.category.id),
    sourceId: String(signal.source.id),
    signalTypeCode: signal.signalType.code,
    impactCode: signal.impact.code,
    urgencyCode: signal.urgency.code,
    reliabilityCode: signal.reliability.code,
    scopeCode: signal.scope.code,
    notes: signal.notes ?? "",
    keywordsText: signal.keywords.map((keyword) => keyword.name).join(", ")
  };
}

function SelectField({ error, label, name, options, register }: { error?: string; label: string; name: keyof SignalFormValues; options: SignalFormOption[]; register: ReturnType<typeof useForm<SignalFormValues>>["register"] }) {
  const id = `signal-${name}`;
  return <div className={styles.field}><FieldLabel help={FIELD_HELP[name] ?? "Selecciona el valor que mejor describa la evidencia disponible."} htmlFor={id}>{label}</FieldLabel><select aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} id={id} {...register(name)}><option value="">Selecciona una opción</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error && <small className={styles.error} id={`${id}-error`}>{error}</small>}</div>;
}

function SignalForm({ initial, mode, onReload, options, signal }: { initial: SignalFormValues; mode: "create" | "edit"; onReload?: () => void; options: SignalFormOptions; signal?: Signal }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formState: { errors }, handleSubmit, register, setError } = useForm<SignalFormValues>({ defaultValues: initial });
  const mutation = useMutation({ mutationFn: async (values: SignalFormValues) => {
    const input = toSignalInput(values);
    return mode === "create" ? createSignal(input, auth.token!) : updateSignal(signal!.id, { ...input, updatedAt: signal!.updatedAt }, auth.token!);
  } });
  const submit = handleSubmit(async (values) => {
    const validation = signalFormSchema.safeParse(values);
    if (!validation.success) { applyZodErrors(validation.error, setError); return; }
    mutation.reset();
    try {
      const response = await mutation.mutateAsync(validation.data);
      await queryClient.invalidateQueries({ queryKey: ["admin-entities", "signals"] });
      navigate(auth.hasPermission("signals:read-internal") ? `/admin/senales/${response.data.id}` : "/admin", { replace: true });
    } catch (error) {
      if (isApiError(error)) error.details.forEach((detail) => {
        if (!detail.field) return;
        const field = detail.field === "keywords" ? "keywordsText" : detail.field;
        if (field in initial) setError(field as keyof SignalFormValues, { type: "server", message: detail.message });
      });
    }
  });
  const apiError = mutation.error && isApiError(mutation.error) ? mutation.error : null;
  const conflict = apiError?.status === 409;
  return <form className={styles.form} noValidate onSubmit={submit}>
    {mutation.isError && <div className={styles.summary} role="alert"><p>{conflict ? "La señal cambió en otra sesión. Tus datos no se sobrescribieron; recarga la versión actual antes de volver a guardar." : apiError?.message ?? "No fue posible guardar la señal."}</p>{conflict && onReload && <Button onClick={onReload}>Recargar versión actual</Button>}</div>}
    <section className={styles.section} aria-labelledby="signal-general"><h2 id="signal-general">Información de la señal</h2><div className={styles.grid}>
      <div className={`${styles.field} ${styles.wide}`}><FieldLabel help="Describe el hecho o cambio principal con precisión y sin conclusiones no sustentadas." htmlFor="signal-title">Título</FieldLabel><input aria-invalid={Boolean(errors.title)} id="signal-title" maxLength={200} {...register("title")} />{errors.title && <small className={styles.error}>{errors.title.message}</small>}</div>
      <div className={`${styles.field} ${styles.wide}`}><FieldLabel help="Explica qué cambió, cuál es la evidencia y por qué resulta relevante para el ecosistema." htmlFor="signal-summary">Resumen</FieldLabel><textarea aria-invalid={Boolean(errors.summary)} id="signal-summary" maxLength={5000} rows={6} {...register("summary")} />{errors.summary && <small className={styles.error}>{errors.summary.message}</small>}</div>
      <div className={styles.field}><FieldLabel help="Fecha original del documento o acontecimiento. Para señales nuevas se recomienda evidencia de los últimos 90 días." htmlFor="signal-publication-date">Fecha de publicación</FieldLabel><input aria-invalid={Boolean(errors.publicationDate)} id="signal-publication-date" type="date" {...register("publicationDate")} />{errors.publicationDate && <small className={styles.error}>{errors.publicationDate.message}</small>}</div>
      <SelectField error={errors.signalTypeCode?.message} label="Tipo de señal" name="signalTypeCode" options={options.signalTypes} register={register} />
      <div className={`${styles.field} ${styles.wide}`}><FieldLabel help="Enlace directo y verificable al recurso que sustenta la señal; evita páginas de inicio o enlaces temporales." htmlFor="signal-evidence-url">URL de evidencia</FieldLabel><input aria-invalid={Boolean(errors.evidenceUrl)} id="signal-evidence-url" maxLength={2000} placeholder="https://…" type="url" {...register("evidenceUrl")} />{errors.evidenceUrl && <small className={styles.error}>{errors.evidenceUrl.message}</small>}</div>
      <SelectField error={errors.categoryId?.message} label="Categoría y FCV" name="categoryId" options={options.categories} register={register} />
      <SelectField error={errors.sourceId?.message} label="Fuente" name="sourceId" options={options.sources} register={register} />
    </div></section>
    <section className={styles.section} aria-labelledby="signal-assessment"><h2 id="signal-assessment">Valoración</h2><p>El backend calcula IPS y prioridad al guardar; el frontend no anticipa ni modifica ese resultado.</p><div className={styles.grid}>
      <SelectField error={errors.impactCode?.message} label="Impacto" name="impactCode" options={options.impacts} register={register} />
      <SelectField error={errors.urgencyCode?.message} label="Urgencia" name="urgencyCode" options={options.urgencies} register={register} />
      <SelectField error={errors.reliabilityCode?.message} label="Confiabilidad" name="reliabilityCode" options={options.reliabilities} register={register} />
      <SelectField error={errors.scopeCode?.message} label="Alcance" name="scopeCode" options={options.scopes} register={register} />
    </div></section>
    <section className={styles.section} aria-labelledby="signal-context"><h2 id="signal-context">Contexto interno</h2><div className={styles.grid}>
      <div className={`${styles.field} ${styles.wide}`}><FieldLabel help="Términos específicos que facilitan búsqueda y agrupación; evita repetir palabras genéricas del título." htmlFor="signal-keywords">Palabras clave</FieldLabel><small>Separa hasta 20 términos con comas o saltos de línea.</small><textarea aria-invalid={Boolean(errors.keywordsText)} id="signal-keywords" rows={3} {...register("keywordsText")} />{errors.keywordsText && <small className={styles.error}>{errors.keywordsText.message}</small>}</div>
      <div className={`${styles.field} ${styles.wide}`}><FieldLabel help="Registra dudas, contradicciones, evidencia pendiente o decisiones metodológicas. No se publica." htmlFor="signal-notes">Notas internas</FieldLabel><textarea aria-invalid={Boolean(errors.notes)} id="signal-notes" maxLength={5000} rows={4} {...register("notes")} />{errors.notes && <small className={styles.error}>{errors.notes.message}</small>}</div>
    </div></section>
    <div className={styles.actions}><Link to={signal ? `/admin/senales/${signal.id}` : "/admin/senales"}>Cancelar</Link><Button disabled={mutation.isPending} type="submit" variant="primary">{mutation.isPending ? "Guardando…" : mode === "create" ? "Crear señal" : "Guardar cambios"}</Button></div>
  </form>;
}

export function SignalFormPage({ mode }: { mode: "create" | "edit" }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const rawId = useParams().id;
  const id = rawId && /^\d+$/.test(rawId) && Number(rawId) > 0 ? Number(rawId) : null;
  const options = useQuery({ queryKey: ["signal-form-options"], queryFn: ({ signal }) => getSignalFormOptions(auth.token!, signal), enabled: Boolean(auth.token) });
  const detail = useQuery({ queryKey: ["admin-entity", "signals", id], queryFn: ({ signal }) => getAdminEntity("signals", id!, auth.token!, signal), enabled: mode === "edit" && Boolean(id && auth.token) });
  const current = detail.data?.data as Signal | undefined;
  const ownsSignal = current?.analyst?.id === auth.user?.id;
  const canEdit = current?.status.code === "NEW" && (auth.hasPermission("signals:update-any") || (auth.hasPermission("signals:update-own") && ownsSignal));
  const loading = options.isPending || (mode === "edit" && detail.isPending);
  const failed = options.isError || (mode === "edit" && detail.isError);
  if (mode === "edit" && !id) return <PageFeedback message="La ruta no contiene un identificador de señal válido." title="Señal no disponible" />;
  if (loading) return <PageFeedback message="Estamos preparando catálogos, fuentes y datos actuales." title="Preparando formulario" />;
  if (failed || !options.data) return <PageFeedback actionLabel="Reintentar" message="No fue posible consultar los datos necesarios para capturar la señal." onAction={() => { void options.refetch(); if (mode === "edit") void detail.refetch(); }} title="Formulario no disponible" />;
  if (options.data.sources.length === 0) return <PageFeedback actionLabel={auth.hasPermission("sources:create") ? "Registrar una fuente" : "Volver a señales"} message="Se necesita al menos una fuente activa antes de capturar señales." onAction={() => navigate(auth.hasPermission("sources:create") ? "/admin/fuentes/nueva" : "/admin/senales")} title="Sin fuentes activas" />;
  if (mode === "edit" && (!current || !canEdit)) return <PageFeedback actionLabel="Volver al detalle" message={current?.status.code !== "NEW" ? "Sólo las señales en estado Nueva pueden editarse." : "Tu cuenta no puede modificar esta señal."} onAction={() => navigate(current ? `/admin/senales/${current.id}` : "/admin/senales")} title="Edición no permitida" />;
  return <section className={styles.page} aria-labelledby="signal-form-title"><header className={styles.header}><div><h1 id="signal-form-title">{mode === "create" ? "Nueva señal" : `Editar ${current!.businessCode}`}</h1><p>Registra evidencia y valoración para incorporarla al flujo interno.</p></div><div className={styles.ips}><span>IPS calculado</span><strong>{current ? `${current.ips}/27` : "Al guardar"}</strong></div></header><SignalForm initial={current ? valuesFromSignal(current) : EMPTY_VALUES} key={current?.updatedAt ?? "new"} mode={mode} onReload={mode === "edit" ? () => void detail.refetch() : undefined} options={options.data} signal={current} /></section>;
}

export function CreateSignalFormPage() {
  return <SignalFormPage mode="create" />;
}

export function EditSignalFormPage() {
  return <SignalFormPage mode="edit" />;
}
