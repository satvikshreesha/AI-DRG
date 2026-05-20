import { useMemo, type ReactNode } from "react";
import { buildRenderSegments, flattenRuns } from "./highlightText";
import type { TextRun, PassageHighlight } from "./highlightTypes";

function renderRunFragment(run: TextRun, text: string): ReactNode {
  if (run.kind === "em") return <em>{text}</em>;
  if (run.kind === "link")
    return (
      <a
        href={run.href}
        target="_blank"
        rel="noreferrer"
        style={{ color: "var(--color-graphite)", textDecoration: "underline" }}
      >
        {text}
      </a>
    );
  return text;
}

type Props = {
  blockId: string;
  anchorId: string;
  paragraphStyle?: React.CSSProperties;
  runs: TextRun[];
  highlights: PassageHighlight[];
  wrapper?: "block" | "inline";
};

export function HighlightableBlock({
  blockId,
  anchorId,
  paragraphStyle,
  runs,
  highlights,
  wrapper = "block",
}: Props) {
  const full = flattenRuns(runs);
  const segments = useMemo(
    () => buildRenderSegments(runs, highlights, blockId),
    [runs, highlights, blockId]
  );

  const inner = segments.map((seg) => {
    const text = full.slice(seg.start, seg.end);
    const run = runs[seg.runIndex];
    let node: ReactNode = renderRunFragment(run, text);
    const key = `${seg.start}-${seg.end}`;
    if (seg.highlight) {
      const h = seg.highlight;
      node = (
        <mark
          key={key}
          data-highlight-id={h.id}
          title={h.note || undefined}
          style={{
            backgroundColor: h.color,
            cursor: "pointer",
            padding: "0 1px",
            borderRadius: 2,
          }}
        >
          {node}
        </mark>
      );
    } else {
      node = <span key={key}>{node}</span>;
    }
    return node;
  });

  if (wrapper === "inline") {
    return (
      <span id={anchorId} data-highlight-block={blockId} data-section-label="">
        {inner}
      </span>
    );
  }

  return (
    <div id={anchorId} data-highlight-block={blockId}>
      <p style={paragraphStyle}>{inner}</p>
    </div>
  );
}
