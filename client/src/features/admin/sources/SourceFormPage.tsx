import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "@/api";
import { Button } from "@/components/ui/Button";
import { PageFeedback } from "@/components/feedback/PageFeedback";
import { FieldLabel } from "@/components/forms/FieldHelp";
import { useAuth } from "@/features/auth/AuthContext";
import { createSource, getSource, getSourceTypes, updateSource } from "./source.service";
import type { Source, SourceInput } from "./source.types";
import styles from "../signals/SignalForm.module.css";

type Values = { typeCode: string; name: string; website: string; country: string; rssUrl: string; apiUrl: string; historicalReliability: string };
const EMPTY: Values = { typeCode: "", name: "", website: "", country: "", rssUrl: "", apiUrl: "", historicalReliability: "" };
const nullable = (value: string) => value.trim() || null;
const toInput = (v: Values): SourceInput => ({ typeCode: v.typeCode, name: v.name.trim(), website: nullable(v.website), country: nullable(v.country), rssUrl: nullable(v.rssUrl), apiUrl: nullable(v.apiUrl), historicalReliability: v.historicalReliability === "" ? null : Number(v.historicalReliability) });

export function SourceFormPage({ mode }: { mode: "create" | "edit" }) {
  const auth = useAuth(); const navigate = useNavigate(); const queryClient = useQueryClient();
  const rawId = useParams().id; const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;
  const types = useQuery({ queryKey: ["source-types"], queryFn: ({ signal }) => getSourceTypes(signal) });
  const detail = useQuery({ queryKey: ["source", id], queryFn: ({ signal }) => getSource(id!, auth.token!, signal), enabled: mode === "edit" && Boolean(id) });
  const source = detail.data?.data;
  const initial: Values = source ? { typeCode: source.type.code, name: source.name, website: source.website ?? "", country: source.country ?? "", rssUrl: source.rssUrl ?? "", apiUrl: source.apiUrl ?? "", historicalReliability: source.historicalReliability?.toString() ?? "" } : EMPTY;
  if (mode === "edit" && !id) return <PageFeedback title="Fuente no disponible" message="El identificador no es válido." />;
  if (types.isPending || (mode === "edit" && detail.isPending)) return <PageFeedback title="Preparando formulario" message="Consultando catálogo y versión actual." />;
  if (types.isError || (mode === "edit" && (!source || detail.isError))) return <PageFeedback title="Formulario no disponible" message="No fue posible consultar la fuente." />;
  return <SourceForm initial={initial} key={source?.updatedAt ?? "new"} mode={mode} source={source} types={types.data!.data.items} token={auth.token!} onSaved={async (savedId) => { await queryClient.invalidateQueries({ queryKey: ["sources"] }); navigate(`/admin/fuentes/${savedId}`); }} />;
}

function SourceForm({ initial, mode, source, types, token, onSaved }: { initial: Values; mode: "create" | "edit"; source?: Source; types: Array<{code:string;name:string}>; token: string; onSaved: (id:number)=>Promise<void> }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Values>({ defaultValues: initial });
  const mutation = useMutation({ mutationFn: (values: Values) => mode === "create" ? createSource(toInput(values), token) : updateSource(source!.id, { ...toInput(values), updatedAt: source!.updatedAt }, token) });
  const submit = handleSubmit(async (values) => {
    if (!values.name.trim()) { setError("name", { message: "Escribe el nombre de la fuente." }); return; }
    if (!values.typeCode) { setError("typeCode", { message: "Selecciona el tipo." }); return; }
    const reliability = values.historicalReliability === "" ? null : Number(values.historicalReliability);
    if (reliability !== null && (reliability < 0 || reliability > 1)) { setError("historicalReliability", { message: "Usa un valor entre 0 y 1." }); return; }
    try { const response = await mutation.mutateAsync(values); await onSaved(response.data.id); } catch { /* rendered below */ }
  });
  const apiError = mutation.error && isApiError(mutation.error) ? mutation.error : null;
  return <section className={styles.page}><header className={styles.header}><div><h1>{mode === "create" ? "Nueva fuente" : `Editar ${source?.name ?? "fuente"}`}</h1><p>Registra el origen que podrá utilizarse como evidencia en las señales.</p></div></header><form className={styles.form} onSubmit={submit} noValidate>
    {mutation.isError && <div className={styles.summary} role="alert">{apiError?.status === 409 ? "La fuente cambió en otra sesión. Recarga antes de guardar." : apiError?.message ?? "No fue posible guardar la fuente."}</div>}
    <section className={styles.section}><h2>Identificación</h2><div className={styles.grid}>
      <div className={styles.field}><FieldLabel help="Clasifica la fuente como académica, industrial, gubernamental, consultoría o medio especializado." htmlFor="source-type">Tipo</FieldLabel><select id="source-type" {...register("typeCode")}><option value="">Selecciona una opción</option>{types.map((type)=><option key={type.code} value={type.code}>{type.name}</option>)}</select>{errors.typeCode && <small className={styles.error}>{errors.typeCode.message}</small>}</div>
      <div className={styles.field}><FieldLabel help="Nombre oficial de la institución, publicación, empresa o repositorio, suficiente para localizarlo." htmlFor="source-name">Nombre</FieldLabel><input id="source-name" maxLength={200} {...register("name")} />{errors.name && <small className={styles.error}>{errors.name.message}</small>}</div>
      <div className={styles.field}><FieldLabel help="Origen institucional o cobertura principal; usa región cuando la fuente no corresponda a un solo país." htmlFor="source-country">País o región</FieldLabel><input id="source-country" maxLength={100} {...register("country")} /></div>
      <div className={styles.field}><FieldLabel help="Valor normalizado de 0 a 1 basado en identificación, autoridad y comportamiento previo. Revísalo al menos cada 12 meses." htmlFor="source-reliability">Confiabilidad histórica (0–1)</FieldLabel><input id="source-reliability" min="0" max="1" step="0.01" type="number" {...register("historicalReliability")} />{errors.historicalReliability && <small className={styles.error}>{errors.historicalReliability.message}</small>}</div>
    </div></section><section className={styles.section}><h2>Canales</h2><div className={styles.grid}>{([["website","Sitio web"],["rssUrl","URL RSS"],["apiUrl","URL API"]] as const).map(([name,label])=><div className={`${styles.field} ${styles.wide}`} key={name}><FieldLabel help={name === "website" ? "Página institucional principal y estable." : name === "rssUrl" ? "Canal RSS oficial para monitoreo automatizado." : "Endpoint oficial documentado; no ingreses credenciales ni tokens."} htmlFor={`source-${name}`}>{label}</FieldLabel><input id={`source-${name}`} maxLength={2000} type="url" {...register(name)} /></div>)}</div></section>
    <div className={styles.actions}><Link to={source ? `/admin/fuentes/${source.id}` : "/admin/fuentes"}>Cancelar</Link><Button disabled={mutation.isPending} type="submit" variant="primary">{mutation.isPending ? "Guardando…" : "Guardar fuente"}</Button></div>
  </form></section>;
}

export const CreateSourceFormPage = () => <SourceFormPage mode="create" />;
export const EditSourceFormPage = () => <SourceFormPage mode="edit" />;
