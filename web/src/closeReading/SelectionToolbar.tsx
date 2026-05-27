import { useEffect, useRef, useState } from "react";
import { HIGHLIGHT_PALETTE } from "./highlightTypes";

const toolbarBox: React.CSSProperties = {
  position: "fixed",
  zIndex: 1000,
  background: "var(--color-paper-white)",
  border: "1px solid var(--color-hairline)",
  borderRadius: 12,
  boxShadow: "var(--shadow-card)",
  padding: 12,
  minWidth: 280,
  fontFamily: "inherit",
  fontSize: "var(--text-body-sm)",
};

export type DraftState = {
  blockId: string;
  start: number;
  end: number;
  left: number;
  top: number;
  quote: string;
  sectionLabel?: string;
};

export function NewHighlightToolbar({
  draft,
  onDismiss,
  onSave,
}: {
  draft: DraftState;
  onDismiss: () => void;
  onSave: (color: string, note: string) => void;
}) {
  const [color, setColor] = useState<string>(HIGHLIGHT_PALETTE[0].color);
  const [note, setNote] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    noteRef.current?.focus();
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      style={{
        ...toolbarBox,
        left: draft.left,
        top: draft.top,
        transform: "translate(-50%, 0)",
      }}
    >
      <div
        style={{
          marginBottom: 8,
          fontWeight: "var(--weight-medium)",
          color: "var(--color-graphite)",
        }}
      >
        Highlight and annotate
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {HIGHLIGHT_PALETTE.map((p) => (
          <button
            key={p.key}
            type="button"
            title={p.key}
            onClick={() => setColor(p.color)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border:
                color === p.color
                  ? `2px solid ${p.border}`
                  : "2px solid transparent",
              background: p.color,
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
      <textarea
        ref={noteRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Annotation (optional)"
        rows={3}
        style={{
          width: "100%",
          boxSizing: "border-box",
          resize: "vertical",
          marginBottom: 10,
          font: "inherit",
          padding: 8,
          borderRadius: 6,
          border: "1px solid var(--color-hairline)",
          background: "var(--color-parchment)",
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--color-hairline)",
            background: "var(--color-paper-white)",
            cursor: "pointer",
            fontSize: "var(--text-body-sm)",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(color, note)}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--color-graphite)",
            background: "var(--color-graphite)",
            color: "var(--color-paper-white)",
            cursor: "pointer",
            fontSize: "var(--text-body-sm)",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
