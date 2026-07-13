import type { PublicSection } from "./types";
import { TextBlockRenderer } from "./TextBlockRenderer";
import styles from "./Editorial.module.css";

function SectionBlocks({ section }: { section: PublicSection }) {
  return <div className={styles.sectionBody}>{section.blocks.map((block) => <TextBlockRenderer block={block} key={block.id} />)}</div>;
}

export function EditorialSection({ section }: { section: PublicSection }) {
  const titleId = section.title ? "content-section-" + section.id : undefined;
  if (section.isCollapsible) {
    return <details className={styles.collapsible}><summary>{section.title || "Sección"}</summary><SectionBlocks section={section} /></details>;
  }
  return <section aria-labelledby={titleId} className={styles.section}>{section.title && <h2 id={titleId}>{section.title}</h2>}<SectionBlocks section={section} /></section>;
}
