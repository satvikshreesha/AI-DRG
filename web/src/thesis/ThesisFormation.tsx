import { useEffect, useMemo, useState } from "react";
import { useSession } from "../state/SessionProvider";
import { critiqueThesis, summarizeCanvas } from "../lib/ai";

export function ThesisFormation() {
  const {
    state,
    setThesis,
    setThesisCritique,
    setCanvasSummary,
    openTab,
  } = useSession();

  const [draftThesis, setDraftThesis] = useState(state.thesis);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [critiqueLoading, setCritiqueLoading] = useState(false);

  /* Sync editor when thesis is reset externally. */
  useEffect(() => {
    setDraftThesis(state.thesis);
  }, [state.thesis]);

  /* Auto-generate the canvas summary the first time the user lands here, OR
     when the canvas content meaningfully changes. */
  const summaryKey = useMemo(
    () =>
      `${state.groups.map((g) => g.label).join("|")}::${state.connections.length}::${state.cards.length}`,
    [state.groups, state.connections, state.cards]
  );
  const [lastSummaryKey, setLastSummaryKey] = useState(state.canvasSummary ? summaryKey : "");

  useEffect(() => {
    if (state.canvasSummary && lastSummaryKey === summaryKey) return;
    setSummaryLoading(true);
    const groups = state.groups.map((g) => ({
      id: g.id,
      label: g.label || "(untitled)",
      highlightIds: g.cardIds
        .map((cid) => state.cards.find((c) => c.id === cid)?.highlightId ?? "")
        .filter(Boolean),
    }));
    const connections = state.connections.map((c) => ({
      fromId: state.cards.find((card) => card.id === c.fromCardId)?.highlightId ?? "",
      toId: state.cards.find((card) => card.id === c.toCardId)?.highlightId ?? "",
      label: c.label,
    }));
    summarizeCanvas({
      highlights: state.highlights,
      groups,
      connections,
    })
      .then((text) => {
        setCanvasSummary(text);
        setLastSummaryKey(summaryKey);
      })
      .finally(() => setSummaryLoading(false));
  }, [
    summaryKey,
    state.canvasSummary,
    state.groups,
    state.connections,
    state.cards,
    state.highlights,
    setCanvasSummary,
    lastSummaryKey,
  ]);

  const onCritique = async () => {
    if (!draftThesis.trim()) return;
    setThesis(draftThesis);
    setCritiqueLoading(true);
    try {
      const c = await critiqueThesis(draftThesis);
      setThesisCritique(c);
    } finally {
      setCritiqueLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--color-paper-white)",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "48px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <header>
          <div
            style={{
              fontSize: "var(--text-caption)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--color-faded-stone)",
              marginBottom: 8,
            }}
          >
            Thesis formation
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: "var(--weight-medium)",
              margin: 0,
              letterSpacing: "-0.005em",
            }}
          >
            What is the argument worth defending?
          </h1>
        </header>

        <section>
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-faded-stone)",
              marginBottom: 8,
            }}
          >
            Summary of your Interpretation Canvas
          </div>
          <div
            style={{
              border: "1px solid var(--color-hairline)",
              borderRadius: 16,
              padding: 20,
              background: "var(--color-paper-white)",
              lineHeight: 1.6,
              minHeight: 100,
            }}
          >
            {summaryLoading ? (
              <ThinkingLine label="Thinking" />
            ) : state.canvasSummary ? (
              <RichText text={state.canvasSummary} />
            ) : (
              <span style={{ color: "var(--color-faded-stone)" }}>
                Add highlights, groups, and connections on the Interpretation
                Canvas to generate a summary.
              </span>
            )}
          </div>
        </section>

        <section>
          <div
            style={{
              border: "1px solid var(--color-hairline)",
              borderRadius: 16,
              padding: 16,
              background: "var(--color-paper-white)",
            }}
          >
            <textarea
              value={draftThesis}
              onChange={(e) => setDraftThesis(e.target.value)}
              placeholder="Enter your thesis here"
              rows={4}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                resize: "vertical",
                background: "transparent",
                fontSize: "var(--text-body)",
                lineHeight: 1.6,
                color: "var(--color-inkwell)",
                fontFamily: "inherit",
                minHeight: 72,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 8,
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={onCritique}
                disabled={!draftThesis.trim() || critiqueLoading}
                style={{
                  background: critiqueLoading
                    ? "var(--color-parchment)"
                    : "var(--color-paper-white)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-pill)",
                  padding: "5px 14px",
                  cursor: draftThesis.trim() ? "pointer" : "not-allowed",
                  fontSize: "var(--text-body-sm)",
                  color: "var(--color-graphite)",
                }}
              >
                {critiqueLoading ? "Thinking…" : "Critique"}
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: "var(--text-caption)",
              color: "var(--color-faded-stone)",
            }}
          >
            *AI thinking module to poke holes in your thesis
          </div>
        </section>

        {(state.thesisCritique || critiqueLoading) && (
          <section>
            <div
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--color-faded-stone)",
                marginBottom: 8,
              }}
            >
              Critique
            </div>
            {critiqueLoading ? (
              <ThinkingLine label="Thinking" />
            ) : (
              <div
                style={{
                  color: "var(--color-graphite)",
                  fontSize: "var(--text-body-sm)",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  animation: "fadeInUp 320ms ease-out",
                }}
              >
                {state.thesisCritique}
              </div>
            )}
          </section>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setThesis(draftThesis);
              openTab("structure");
            }}
            disabled={!draftThesis.trim()}
            style={{
              background: draftThesis.trim()
                ? "var(--color-graphite)"
                : "var(--color-paper-white)",
              color: draftThesis.trim()
                ? "var(--color-paper-white)"
                : "var(--color-faded-stone)",
              border: draftThesis.trim()
                ? "1px solid var(--color-graphite)"
                : "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-pill)",
              padding: "8px 18px",
              fontSize: "var(--text-body-sm)",
              cursor: draftThesis.trim() ? "pointer" : "not-allowed",
            }}
          >
            Save thesis & open structure →
          </button>
        </div>
      </div>
    </div>
  );
}

function ThinkingLine({ label }: { label: string }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setDots((d) => (d + 1) % 4), 380);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div
      style={{
        color: "var(--color-faded-stone)",
        fontSize: "var(--text-body-sm)",
        fontStyle: "italic",
      }}
    >
      {label}
      {".".repeat(dots)}
    </div>
  );
}

/** Render a small subset of markdown-ish formatting: **bold** and *em*. */
function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(<span key={i++}>{text.slice(cursor, match.index)}</span>);
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={i++} style={{ fontWeight: "var(--weight-medium)" }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(<em key={i++}>{token.slice(1, -1)}</em>);
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length) parts.push(<span key={i++}>{text.slice(cursor)}</span>);
  return <>{parts}</>;
}
