import type { ReactNode } from "react";

// Lightweight, SAFE rich-text renderer for internal messages/comments. Renders
// **bold**, http(s) links, @mentions, and line breaks as REACT NODES (never
// dangerouslySetInnerHTML), so there is no HTML-injection surface. Message bodies
// already reject < > at the API layer; this only adds presentation.

const TOKEN = /(\*\*[^*\n]+\*\*|https?:\/\/[^\s]+|@[\p{L}\p{N}_]+)/gu;

function renderLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**") && tok.endsWith("**")) {
      out.push(<strong key={key} className="font-bold text-foreground">{tok.slice(2, -2)}</strong>);
    } else if (/^https?:\/\//.test(tok)) {
      out.push(
        <a key={key} href={tok} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 break-all hover:opacity-80">{tok}</a>,
      );
    } else {
      out.push(<span key={key} className="text-primary font-semibold">{tok}</span>);
    }
    last = m.index + tok.length;
    key++;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((l, i) => (
        <span key={i}>
          {renderLine(l)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}
