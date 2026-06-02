import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSession } from "../state/SessionProvider";
import { critiqueThesis, summarizeCanvas } from "../lib/ai";

const SUMMARY_AI_TOOLTIP =
  "This summary is generated from the story and only the annotations, groupings, and connections you made on the Interpretation Canvas.";

const CRITIQUE_AI_TOOLTIP =
  "The AI will keep critiquing your thesis whenever you ask. It will never give you an explicit green light to begin drafting your essay — you decide when your thesis accurately reflects the viewpoint you want to argue.";

/* ─────────────────────────────────────────────────────────
 * SURFACE LANGUAGE
 *
 *   INPUT_SURFACE   active thesis form  → sole elevated white card
 *
 * Canvas summary and critique sit inline on the page (no card).
 * ───────────────────────────────────────────────────────── */
const SURFACE_RADIUS = "calc(var(--radius-card) + 4px)";

const INPUT_SURFACE: CSSProperties = {
  background: "var(--color-paper-white)",
  border: "1px solid var(--color-hairline)",
  borderRadius: SURFACE_RADIUS,
  boxShadow: "var(--shadow-card)",
};

const INLINE_PROSE: CSSProperties = {
  lineHeight: 1.65,
  fontSize: "var(--text-body-sm)",
};

const EYEBROW: CSSProperties = {
  fontSize: "var(--text-caption)",
  fontWeight: "var(--weight-medium)",
  color: "var(--color-faded-stone)",
  letterSpacing: "0.03em",
  marginBottom: 8,
};

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

  const canSave = draftThesis.trim().length > 0;

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

  const onSave = () => {
    setThesis(draftThesis);
    openTab("structure");
  };

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--color-parchment)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          padding: "48px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          boxSizing: "border-box",
        }}
      >
        <header>
          <div
            style={{
              ...EYEBROW,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Thesis formation
          </div>
          <h1
            style={{
              fontSize: "var(--text-h2)",
              fontWeight: "var(--weight-medium)",
              margin: 0,
              letterSpacing: "-0.005em",
              color: "var(--color-inkwell)",
            }}
          >
            What is the argument worth defending?
          </h1>
        </header>

        <CanvasSummarySection
          tooltip={SUMMARY_AI_TOOLTIP}
          loading={summaryLoading}
          summary={state.canvasSummary}
        />

        <p
          style={{
            margin: "8px 0 0",
            color: "var(--color-dusk-gray)",
            fontSize: "var(--text-body-sm)",
            lineHeight: 1.5,
          }}
        >
          Now draft your argument — one clear claim you can defend.
        </p>

        <section style={{ marginTop: 8 }}>
          <div style={EYEBROW}>Your thesis</div>
          <ThesisInput
            value={draftThesis}
            onChange={setDraftThesis}
            canSave={canSave}
            critiqueLoading={critiqueLoading}
            onCritique={onCritique}
            onSave={onSave}
          />
        </section>

        {(state.thesisCritique || critiqueLoading) && (
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span style={{ ...EYEBROW, marginBottom: 0 }}>Critique</span>
              <InfoTooltip
                id="thesis-critique-ai-tooltip"
                label="How critique works"
                text={CRITIQUE_AI_TOOLTIP}
              />
            </div>
            <CritiqueContent loading={critiqueLoading} text={state.thesisCritique} />
          </section>
        )}
      </div>
    </div>
  );
}

function ThesisInput({
  value,
  onChange,
  canSave,
  critiqueLoading,
  onCritique,
  onSave,
}: {
  value: string;
  onChange: (v: string) => void;
  canSave: boolean;
  critiqueLoading: boolean;
  onCritique: () => void;
  onSave: () => void;
}) {
  const canCritique = canSave && !critiqueLoading;

  return (
    <div
      style={{
        ...INPUT_SURFACE,
        padding: 16,
      }}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your thesis here..."
        rows={4}
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          resize: "none",
          fontSize: "var(--text-body)",
          lineHeight: 1.5,
          color: "var(--color-inkwell)",
          fontFamily: "inherit",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 12,
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={onCritique}
          disabled={!canCritique}
          style={{
            background: critiqueLoading
              ? "var(--color-parchment-elevated)"
              : "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-pill)",
            padding: "8px 18px",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-sm)",
            fontWeight: "var(--weight-medium)",
            color: canCritique
              ? "var(--color-graphite)"
              : "var(--color-faded-stone)",
            cursor: canCritique ? "pointer" : "not-allowed",
            transition:
              "background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)",
          }}
        >
          {critiqueLoading ? "Thinking…" : "Critique"}
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          style={{
            background: canSave
              ? "var(--color-graphite)"
              : "var(--color-parchment-elevated)",
            color: canSave
              ? "var(--color-paper-white)"
              : "var(--color-faded-stone)",
            border: canSave
              ? "1px solid var(--color-graphite)"
              : "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-pill)",
            padding: "8px 18px",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-sm)",
            fontWeight: "var(--weight-medium)",
            cursor: canSave ? "pointer" : "not-allowed",
            transition:
              "background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)",
          }}
        >
          Save thesis & open structure →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — canvas summary collapse
 *
 *   0ms   toggle clicked
 *   0ms   grid 1fr → 0fr (or reverse), content fades + slides 6px
 * 280ms   resting state
 * ───────────────────────────────────────────────────────── */
const SUMMARY_COLLAPSE = {
  duration: 280,
  ease: "cubic-bezier(0.2, 0, 0.2, 1)",
  contentOffset: 6,
  headerGap: 8,
};

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — critique reveal
 *
 *    0ms   fetch completes (or critique remounted)
 *    0ms   "Thinking…" holds on screen
 *  500ms   first line fades in + slides up
 *  660ms   second line (stagger 160ms per line)
 *  ...     until all lines visible
 * ───────────────────────────────────────────────────────── */
const CRITIQUE_REVEAL = {
  thinkingHold: 500,
  lineStagger: 160,
  lineDuration: 320,
};

function CritiqueContent({
  loading,
  text,
}: {
  loading: boolean;
  text: string | null;
}) {
  const [phase, setPhase] = useState<"idle" | "thinking" | "revealing">("idle");
  const [visibleLines, setVisibleLines] = useState(0);
  const lines = useMemo(() => (text ? text.split("\n") : []), [text]);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (loading) {
      setPhase("thinking");
      setVisibleLines(0);
      return;
    }
    if (!text) {
      setPhase("idle");
      setVisibleLines(0);
      return;
    }
    if (reducedMotion) {
      setPhase("revealing");
      setVisibleLines(lines.length);
      return;
    }
    setPhase("thinking");
    setVisibleLines(0);
    const holdId = window.setTimeout(() => {
      setPhase("revealing");
      setVisibleLines(1);
    }, CRITIQUE_REVEAL.thinkingHold);
    return () => window.clearTimeout(holdId);
  }, [loading, text, lines.length, reducedMotion]);

  useEffect(() => {
    if (phase !== "revealing" || reducedMotion) return;
    if (visibleLines >= lines.length) return;
    const id = window.setTimeout(() => {
      setVisibleLines((n) => n + 1);
    }, CRITIQUE_REVEAL.lineStagger);
    return () => window.clearTimeout(id);
  }, [phase, visibleLines, lines.length, reducedMotion]);

  if (loading || phase === "thinking") {
    return <ThinkingLine label="Thinking" />;
  }

  if (!text) return null;

  return (
    <div
      style={{
        ...INLINE_PROSE,
        color: "var(--color-dusk-gray)",
      }}
    >
      {lines.map((line, index) => (
        <div
          key={`${index}-${line.slice(0, 24)}`}
          className={
            index < visibleLines ? "thesis-critique-line is-visible" : "thesis-critique-line"
          }
          style={{
            whiteSpace: "pre-wrap",
            minHeight: line ? undefined : "1.65em",
            "--critique-line-duration": `${CRITIQUE_REVEAL.lineDuration}ms`,
          } as CSSProperties}
        >
          {line || "\u00A0"}
        </div>
      ))}
    </div>
  );
}

function CanvasSummarySection({
  tooltip,
  loading,
  summary,
}: {
  tooltip: string;
  loading: boolean;
  summary: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const contentId = "thesis-canvas-summary-content";

  return (
    <section
      style={{
        "--canvas-summary-collapse-duration": `${SUMMARY_COLLAPSE.duration}ms`,
        "--canvas-summary-collapse-ease": SUMMARY_COLLAPSE.ease,
        "--canvas-summary-content-offset": `${SUMMARY_COLLAPSE.contentOffset}px`,
      } as CSSProperties}
    >
      <div
        className="canvas-summary-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: expanded ? SUMMARY_COLLAPSE.headerGap : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ ...EYEBROW, marginBottom: 0 }}>From your canvas</span>
          <InfoTooltip
            id="thesis-summary-ai-tooltip"
            label="How this summary is generated"
            text={tooltip}
          />
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={expanded ? "Collapse canvas summary" : "Expand canvas summary"}
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: 24,
            height: 24,
            borderRadius: "var(--radius-nav)",
            border: "1px transparent",
            background: "transparent",
            color: "var(--color-faded-stone)",
            fontSize: 16,
            fontFamily: "var(--font-sans)",
            fontWeight: "var(--weight-medium)",
            lineHeight: 1,
            padding: 0,
            cursor: "pointer",
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>
      <div
        className={`canvas-summary-collapse${expanded ? " is-expanded" : ""}`}
      >
        <div className="canvas-summary-collapse__clip">
          <div
            id={contentId}
            className="canvas-summary-collapse__content"
            aria-hidden={!expanded}
            style={{
              ...INLINE_PROSE,
              color: "var(--color-graphite)",
            }}
          >
            {loading ? (
              <ThinkingLine label="Thinking" />
            ) : summary ? (
              <RichText text={summary} />
            ) : (
              <span style={{ color: "var(--color-faded-stone)", fontStyle: "italic" }}>
                Add highlights, groups, and connections on the Interpretation
                Canvas to generate a summary.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoTooltip({
  id,
  label,
  text,
}: {
  id: string;
  label: string;
  text: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <button
        type="button"
        aria-describedby={id}
        aria-label={label}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1px solid var(--color-hairline)",
          background: "transparent",
          color: "var(--color-faded-stone)",
          fontSize: 10,
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--weight-medium)",
          lineHeight: 1,
          padding: 0,
          cursor: "help",
        }}
      >
        i
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(100% + 8px)",
            transform: "translateX(-50%)",
            width: "max-content",
            maxWidth: 280,
            padding: "10px 12px",
            background: "var(--color-graphite)",
            color: "var(--color-paper-white)",
            fontSize: "var(--text-caption)",
            lineHeight: 1.5,
            fontWeight: "var(--weight-regular)",
            borderRadius: "var(--radius-nav)",
            boxShadow: "var(--shadow-soft)",
            zIndex: 10,
          }}
        >
          {text}
        </span>
      ) : null}
    </span>
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
