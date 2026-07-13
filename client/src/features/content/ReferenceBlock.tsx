import { Link } from "react-router-dom";
import { formatPublicDate } from "@/features/surveillance/format";
import {
  nestedBoolean,
  nestedCount,
  nestedNumber,
  nestedRecord,
  nestedText,
  type ResolvedReferenceBlock
} from "./resolved-blocks";
import styles from "./ResolvedBlocks.module.css";

const KIND_LABELS = {
  signal: "Señal",
  trend: "Tendencia",
  alert: "Alerta"
} as const;

interface Fact { label: string; value: string; }

function dateValue(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return null;
  try {
    return formatPublicDate(value);
  } catch {
    return null;
  }
}

function named(source: Record<string, unknown> | null, key: string) {
  return nestedText(nestedRecord(source, key), "name");
}

function countFact(label: string, value: number | null) {
  return value === null ? null : { label, value: String(value) };
}

function factsFor(reference: ResolvedReferenceBlock): Fact[] {
  const metadata = reference.metadata;
  if (!metadata) return [];
  if (reference.kind === "signal") {
    const category = nestedRecord(metadata, "category");
    return [
      { label: "Prioridad", value: nestedText(metadata, "priority") ?? "" },
      { label: "IPS", value: nestedNumber(metadata, "ips") === null ? "" : `${nestedNumber(metadata, "ips")}/27` },
      { label: "Categoría", value: nestedText(category, "name") ?? "" },
      { label: "Fuente", value: named(metadata, "source") ?? "" },
      { label: "Publicación", value: dateValue(nestedText(metadata, "publicationDate")) ?? "" }
    ].filter((fact) => fact.value);
  }
  if (reference.kind === "trend") {
    return [
      { label: "Dirección", value: named(metadata, "direction") ?? "" },
      { label: "Madurez", value: named(metadata, "maturity") ?? "" },
      countFact("Señales", nestedNumber(nestedRecord(metadata, "metrics"), "signalCount")),
      countFact("Actores", nestedNumber(nestedRecord(metadata, "metrics"), "actorCount")),
      { label: "Primera evidencia", value: dateValue(nestedText(metadata, "firstSignalDate")) ?? "" }
    ].filter((fact): fact is Fact => Boolean(fact?.value));
  }
  return [
    { label: "Nivel", value: named(metadata, "level") ?? "" },
    countFact("Señales", nestedNumber(nestedRecord(metadata, "metrics"), "signalCount")),
    countFact("Tendencias", nestedNumber(nestedRecord(metadata, "metrics"), "trendCount")),
    countFact("Audiencias", nestedNumber(nestedRecord(metadata, "metrics"), "audienceCount")),
    { label: "Publicación", value: dateValue(nestedText(metadata, "publicationDate")) ?? "" },
    { label: "Fecha límite", value: dateValue(nestedText(metadata, "responseDeadline")) ?? "" }
  ].filter((fact): fact is Fact => Boolean(fact?.value));
}

function relationLabels(reference: ResolvedReferenceBlock) {
  const relations = reference.relations;
  if (!relations) return [];
  if (reference.kind === "signal") {
    return [
      nestedBoolean(relations, "linkedToTrend") ? "Vinculada a una tendencia" : null,
      nestedBoolean(relations, "linkedToAlert") ? "Vinculada a una alerta" : null
    ].filter((value): value is string => Boolean(value));
  }
  if (reference.kind === "trend") {
    const signals = nestedCount(relations, "signals");
    const actors = nestedCount(relations, "actors");
    return [
      signals === null ? null : `${signals} ${signals === 1 ? "señal relacionada" : "señales relacionadas"}`,
      actors === null ? null : `${actors} ${actors === 1 ? "actor relacionado" : "actores relacionados"}`
    ].filter((value): value is string => Boolean(value));
  }
  const signals = nestedCount(relations, "signals");
  const trends = nestedCount(relations, "trends");
  const audiences = nestedCount(relations, "audiences");
  return [
    signals === null ? null : `${signals} ${signals === 1 ? "señal relacionada" : "señales relacionadas"}`,
    trends === null ? null : `${trends} ${trends === 1 ? "tendencia relacionada" : "tendencias relacionadas"}`,
    audiences === null ? null : `${audiences} ${audiences === 1 ? "audiencia" : "audiencias"}`
  ].filter((value): value is string => Boolean(value));
}

export function ReferenceBlock({ reference }: { reference: ResolvedReferenceBlock }) {
  const facts = factsFor(reference);
  const relations = relationLabels(reference);
  const variantClass = styles[reference.variant];
  return (
    <article aria-label={`${KIND_LABELS[reference.kind]}: ${reference.title}`} className={`${styles.reference} ${variantClass}`}>
      <div className={styles.referenceHeader}>
        <span className={`${styles.kind} ${styles[reference.kind]}`}>{KIND_LABELS[reference.kind]}</span>
        <span className={styles.businessCode}>{reference.businessCode}</span>
      </div>
      <p className={styles.referenceTitle}><Link to={reference.publicHref}>{reference.title}</Link></p>
      {reference.summary && <p className={styles.referenceSummary}>{reference.summary}</p>}
      {facts.length > 0 && reference.variant !== "compact" && (
        <dl className={styles.facts}>{facts.slice(0, reference.variant === "card" ? 3 : 6).map((fact) => (
          <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
        ))}</dl>
      )}
      {relations.length > 0 && reference.variant === "featured" && (
        <ul aria-label="Relaciones públicas" className={styles.relations}>{relations.map((relation) => <li key={relation}>{relation}</li>)}</ul>
      )}
      <Link aria-label={`Consultar ${KIND_LABELS[reference.kind].toLocaleLowerCase("es-MX")}: ${reference.title}`} className={styles.referenceLink} to={reference.publicHref}>
        Consultar {KIND_LABELS[reference.kind].toLocaleLowerCase("es-MX")} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
