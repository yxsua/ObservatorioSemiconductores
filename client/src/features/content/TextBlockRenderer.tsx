import { createElement } from "react";
import type { PublicBlock } from "./types";
import { SafeMarkdown } from "./SafeMarkdown";
import { ChartBlock } from "./ChartBlock";
import { DataTable } from "./DataTableBlock";
import { parseChartData, parseTableData } from "./data-blocks";
import { FileBlock, ImageBlock } from "./MediaBlocks";
import { ReferenceBlock } from "./ReferenceBlock";
import { parseResolvedFile, parseResolvedImage, parseResolvedReference } from "./resolved-blocks";
import styles from "./Editorial.module.css";

const WIDTHS = new Set(["narrow", "content", "wide", "full"]);
const ALIGNMENTS = new Set(["left", "center", "right"]);
const BACKGROUNDS = new Set(["none", "muted", "accent"]);
const TONES = new Set(["info", "warning", "success", "danger"]);

function text(value: unknown, max: number) {
  return typeof value === "string" && value.trim() && value.length <= max ? value : null;
}
function setting(value: unknown, allowed: Set<string>) {
  return typeof value === "string" && allowed.has(value) ? value : null;
}
function blockClass(block: PublicBlock) {
  const width = setting(block.settings.width, WIDTHS);
  const alignment = setting(block.settings.alignment, ALIGNMENTS);
  const background = setting(block.settings.background, BACKGROUNDS);
  return [
    styles.block,
    width ? styles["width" + width[0].toUpperCase() + width.slice(1)] : "",
    alignment ? styles["align" + alignment[0].toUpperCase() + alignment.slice(1)] : "",
    background && background !== "none" ? styles["background" + background[0].toUpperCase() + background.slice(1)] : ""
  ].filter(Boolean).join(" ");
}

export function TextBlockRenderer({ block }: { block: PublicBlock }) {
  const data = block.data;
  const className = blockClass(block);
  if (block.type.code === "heading") {
    const value = text(data.text, 300);
    const level = typeof data.level === "number" && Number.isInteger(data.level) && data.level >= 2 && data.level <= 6 ? data.level : null;
    const anchor = typeof data.anchor === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.anchor) ? data.anchor : undefined;
    return value && level ? createElement("h" + level, { className, id: anchor }, value) : <UnsupportedBlock />;
  }
  if (block.type.code === "paragraph") {
    const value = text(data.text, 20000);
    const format = data.format === "markdown" ? "markdown" : data.format === "plain" ? "plain" : null;
    return value && format ? <p className={className}>{format === "markdown" ? <SafeMarkdown text={value} /> : value}</p> : <UnsupportedBlock />;
  }
  if (block.type.code === "quote") {
    const value = text(data.text, 5000);
    const attribution = data.attribution == null ? null : text(data.attribution, 300);
    const source = data.source == null ? null : text(data.source, 500);
    return value ? <blockquote className={className}><p>{value}</p>{(attribution || source) && <footer>{attribution && <cite>{attribution}</cite>}{attribution && source && <span aria-hidden="true"> · </span>}{source && <span>{source}</span>}</footer>}</blockquote> : <UnsupportedBlock />;
  }
  if (block.type.code === "list") {
    const items = Array.isArray(data.items) ? data.items.map((item) => text(item, 2000)).filter((item): item is string => Boolean(item)) : [];
    if (!items.length || !["ordered", "unordered"].includes(String(data.style))) return <UnsupportedBlock />;
    const Tag = data.style === "ordered" ? "ol" : "ul";
    return <Tag className={className}>{items.map((item, index) => <li key={index}>{item}</li>)}</Tag>;
  }
  if (block.type.code === "callout") {
    const value = text(data.text, 5000);
    const title = data.title == null ? null : text(data.title, 200);
    const tone = typeof data.tone === "string" && TONES.has(data.tone) ? data.tone : null;
    return value && tone ? <aside className={className + " " + styles.callout + " " + styles[tone]}><div>{title && <strong>{title}</strong>}<p>{value}</p></div></aside> : <UnsupportedBlock />;
  }
  if (block.type.code === "divider") return <hr className={className} />;
  if (block.type.code === "table") {
    const table = parseTableData(data);
    return table ? <div className={className}><DataTable data={table} /></div> : <UnsupportedBlock />;
  }
  if (block.type.code === "chart") {
    const chart = parseChartData(data);
    return chart ? <div className={className}><ChartBlock data={chart} id={block.id} /></div> : <UnsupportedBlock />;
  }
  if (["signal", "trend", "alert"].includes(block.type.code)) {
    const reference = parseResolvedReference(block.type.code, data, block.resolved);
    return reference ? <div className={className}><ReferenceBlock reference={reference} /></div> : <UnsupportedBlock />;
  }
  if (block.type.code === "image") {
    const image = parseResolvedImage(data, block.resolved);
    return image ? <div className={className}><ImageBlock image={image} /></div> : <UnsupportedBlock />;
  }
  if (block.type.code === "file") {
    const file = parseResolvedFile(data, block.resolved);
    return file ? <div className={className}><FileBlock file={file} /></div> : <UnsupportedBlock />;
  }
  return <UnsupportedBlock />;
}

function UnsupportedBlock() {
  return <p className={styles.unsupported} role="status">Este recurso todavía no puede mostrarse en el portal.</p>;
}
