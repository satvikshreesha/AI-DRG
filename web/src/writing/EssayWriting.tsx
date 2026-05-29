import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "../state/SessionProvider";
import { critiqueEssay, type EssayComment } from "../lib/ai";

const KIND_META: Record<
  EssayComment["kind"],
  { label: string; color: string }
> = {
  argument: { label: "Argument", color: "#6f5a8a" },
  evidence: { label: "Evidence", color: "#4d7a8a" },
  grammar: { label: "Polish", color: "#8a7a4d" },
};

export function EssayWriting() {
  const { state, setEssayDraft, setEssayComments } = useSession();
  const [draft, setDraft] = useState(state.essayDraft);
  const [loading, setLoading] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(state.essayDraft);
  }, [state.essayDraft]);

  /* Auto-save with a small debounce. */
  useEffect(() => {
    const id = window.setTimeout(() => setEssayDraft(draft), 350);
    return () => window.clearTimeout(id);
  }, [draft, setEssayDraft]);

  const onRequestCritique = async () => {
    setLoading(true);
    try {
      const comments = await critiqueEssay(draft);
      setEssayComments(comments);
    } finally {
      setLoading(false);
    }
  };

  const renderedHighlightedEssay = useMemo(
    () => buildHighlightedRender(draft, state.essayComments, hoveredCommentId),
    [draft, state.essayComments, hoveredCommentId]
  );

  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        background: "var(--color-paper-white)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          overflowY: "auto",
          padding: "40px 56px 80px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 720 }}>
          <div
            style={{
              fontSize: "var(--text-caption)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--color-faded-stone)",
              marginBottom: 8,
            }}
          >
            Essay writing
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: "var(--weight-medium)",
              margin: 0,
              marginBottom: 24,
              letterSpacing: "-0.005em",
            }}
          >
            Final draft.
          </h1>

          <div
            style={{
              position: "relative",
              border: "1px solid var(--color-hairline)",
              borderRadius: 12,
              padding: 24,
              background: "var(--color-paper-white)",
              minHeight: 480,
              fontFamily: "var(--font-serif)",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 24,
                pointerEvents: "none",
                fontSize: 17,
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-serif)",
                color: "transparent",
              }}
            >
              {renderedHighlightedEssay}
            </div>
            <textarea
              ref={editorRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Begin your final draft here. Your work in the previous tabs stays open — switch back any time."
              style={{
                position: "relative",
                width: "100%",
                minHeight: 480,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "vertical",
                fontFamily: "var(--font-serif)",
                fontSize: 17,
                lineHeight: 1.75,
                color: "var(--color-inkwell)",
                caretColor: "var(--color-inkwell)",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid var(--color-hairline)",
              fontSize: "var(--text-caption)",
              color: "var(--color-faded-stone)",
              fontStyle: "italic",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            AI was used to support critique and feedback during the essay
            drafting process.
          </div>
        </div>
      </div>

      <aside
        style={{
          borderLeft: "1px solid var(--color-hairline)",
          background: "var(--color-parchment)",
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-caption)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--color-faded-stone)",
            }}
          >
            AI critique
          </div>
          <button
            type="button"
            onClick={onRequestCritique}
            disabled={!draft.trim() || loading}
            style={{
              background: "var(--color-paper-white)",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-pill)",
              padding: "4px 10px",
              fontSize: "var(--text-caption)",
              cursor: draft.trim() ? "pointer" : "not-allowed",
              color: "var(--color-graphite)",
            }}
          >
            {loading ? "Thinking…" : "Run critique"}
          </button>
        </div>

        {state.essayComments.length === 0 ? (
          <div
            style={{
              border: "1px dashed var(--color-hairline)",
              borderRadius: 12,
              padding: 16,
              color: "var(--color-faded-stone)",
              fontSize: "var(--text-body-sm)",
              lineHeight: 1.5,
            }}
          >
            Write at least a paragraph and click <em>Run critique</em> to get
            inline comments here. Comments are aimed at argument, evidence,
            and small polish — not at writing the essay for you.
          </div>
        ) : (
          state.essayComments.map((c) => {
            const meta = KIND_META[c.kind];
            const snippet = draft.slice(c.start, c.end).trim();
            const hovered = hoveredCommentId === c.id;
            return (
              <div
                key={c.id}
                onMouseEnter={() => setHoveredCommentId(c.id)}
                onMouseLeave={() =>
                  setHoveredCommentId((h) => (h === c.id ? null : h))
                }
                style={{
                  background: "var(--color-paper-white)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: 12,
                  padding: 12,
                  outline: hovered
                    ? `1px solid ${meta.color}55`
                    : "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: meta.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "var(--text-caption)",
                      color: meta.color,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
                {snippet && (
                  <div
                    style={{
                      fontSize: "var(--text-caption)",
                      color: "var(--color-faded-stone)",
                      fontStyle: "italic",
                      borderLeft: `2px solid ${meta.color}55`,
                      paddingLeft: 8,
                      marginBottom: 6,
                      maxHeight: 40,
                      overflow: "hidden",
                    }}
                  >
                    “{snippet.length > 80 ? `${snippet.slice(0, 80)}…` : snippet}”
                  </div>
                )}
                <div
                  style={{
                    fontSize: "var(--text-body-sm)",
                    color: "var(--color-graphite)",
                    lineHeight: 1.5,
                  }}
                >
                  {c.message}
                </div>
              </div>
            );
          })
        )}
      </aside>
    </div>
  );
}

/** Build the same essay text with comment ranges marked, used only as a
 *  background visual layer that highlights commented spans without overlapping
 *  the editor's caret. */
function buildHighlightedRender(
  text: string,
  comments: EssayComment[],
  hoveredId: string | null
): React.ReactNode[] {
  if (comments.length === 0) return [text];
  const sorted = [...comments].sort((a, b) => a.start - b.start);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const c of sorted) {
    if (c.start > cursor) nodes.push(text.slice(cursor, c.start));
    const meta = KIND_META[c.kind];
    nodes.push(
      <span
        key={c.id}
        style={{
          background:
            hoveredId === c.id ? `${meta.color}33` : `${meta.color}1A`,
          borderBottom: `2px solid ${meta.color}66`,
        }}
      >
        {text.slice(c.start, c.end)}
      </span>
    );
    cursor = c.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}
