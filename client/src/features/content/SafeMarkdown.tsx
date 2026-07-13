import { Fragment, type ReactNode } from "react";

const TOKEN_PATTERN = /(\*\*[^*\n]+\*\*|\x60[^\x60\n]+\x60|\*[^*\n]+\*|\[[^\]\n]+\]\([^\s)\n]+\))/g;
const LINK_PATTERN = /^\[([^\]]+)\]\(([^)]+)\)$/;

function safeHref(value: string) {
  if (value.startsWith("/") || value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function inline(text: string): ReactNode[] {
  return text.split(TOKEN_PATTERN).filter(Boolean).map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("*") && token.endsWith("*")) return <em key={index}>{token.slice(1, -1)}</em>;
    if (token.startsWith("\u0060") && token.endsWith("\u0060")) return <code key={index}>{token.slice(1, -1)}</code>;
    const link = token.match(LINK_PATTERN);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return <Fragment key={index}>{link[1]}</Fragment>;
      const external = /^https?:\/\//.test(href);
      return <a href={href} key={index} rel={external ? "noreferrer" : undefined} target={external ? "_blank" : undefined}>{link[1]}</a>;
    }
    return <Fragment key={index}>{token}</Fragment>;
  });
}

export function SafeMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  return <>{lines.map((line, index) => <Fragment key={index}>{inline(line)}{index < lines.length - 1 && <br />}</Fragment>)}</>;
}
