import { useState, type CSSProperties } from "react";
import { useSession } from "../state/SessionProvider";
import { TAB_BAR_HEIGHT } from "./TabBar";

/* ─────────────────────────────────────────────────────────
 * STANCE BRIEF — a session anchor, not an annotation card
 *
 * Two stages driven by a single `expanded` flag:
 *
 *   collapsed   pill chip · "Your stance" label + truncated text   (default)
 *      ↓ click
 *   expanded    stacked brief · stance (primary) + prompt (on demand)
 *
 * Distinct from the two existing "tab-like" surfaces on purpose:
 *   · page TabBar      → browser tabs, navigation
 *   · annotation cards → solid white, editable workspace
 *   · this brief       → frosted, read-only, pinned reference
 *
 * Material echoes GutReaction's PROMPT_SURFACE so the committed stance reads
 * as continuous with the moment it was made. Identity is carried by the
 * eyebrow label and structure (shadcn-style), not a decorative accent.
 * All sizing/colour/motion pulls from design tokens.
 * ───────────────────────────────────────────────────────── */

const FROSTED_BRIEF: CSSProperties = {
  background: "rgba(255, 255, 255, 0.72)",
  border: "1px solid var(--color-hairline)",
  boxShadow:
    "0 1px 0 rgba(255, 255, 255, 0.55) inset, var(--shadow-soft)",
  backdropFilter: "blur(20px) saturate(0.95)",
  WebkitBackdropFilter: "blur(20px) saturate(0.95)",
};

const EYEBROW: CSSProperties = {
  fontSize: "var(--text-caption)",
  fontWeight: "var(--weight-medium)",
  color: "var(--color-faded-stone)",
};

const Chevron = ({ open }: { open: boolean }) => (
  <span
    aria-hidden
    style={{
      fontSize: 9,
      lineHeight: 1,
      color: "var(--color-faded-stone)",
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform var(--transition-fast)",
    }}
  >
    ▾
  </span>
);

/**
 * A collapsible brief anchored to the top-right of the active tab content area.
 * Reminds the student of their committed stance (primary) and the essay prompt
 * (secondary, on demand). Visible from Gut Reaction completion until thesis save.
 */
export function StancePill() {
  const { state } = useSession();
  const [expanded, setExpanded] = useState(false);

  if (!state.gutReactionComplete) return null;
  if (state.thesis.trim()) return null;
  if (!state.initialStance.trim()) return null;

  const hasPrompt = state.prompt.trim().length > 0;

  return (
    <div
      style={{
        position: "absolute",
        top: `calc(${TAB_BAR_HEIGHT}px + var(--space-4))`,
        right: "var(--space-5)",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        pointerEvents: "auto",
        maxWidth: "min(280px, calc(100vw - 2 * var(--space-5)))",
      }}
    >
      {expanded ? (
        <div
          style={{
            ...FROSTED_BRIEF,
            width: 280,
            maxWidth: "100%",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-4) var(--space-5)",
            animation: "fadeInUp var(--transition-base)",
          }}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-expanded
            aria-label="Collapse stance"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: "var(--space-3)",
              padding: 0,
              marginBottom: "var(--space-3)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span style={EYEBROW}>Your stance</span>
            <Chevron open />
          </button>

          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: "var(--text-body-sm)",
              color: "var(--color-graphite)",
              lineHeight: "var(--leading-base)",
            }}
          >
            {state.initialStance}
          </p>

          {hasPrompt ? (
            <details style={{ marginTop: "var(--space-3)" }}>
              <summary
                style={{
                  listStyle: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  ...EYEBROW,
                  color: "var(--color-dusk-gray)",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span aria-hidden style={{ fontSize: 9, lineHeight: 1 }}>
                  ▸
                </span>
                View prompt
              </summary>
              <p
                style={{
                  margin: "var(--space-3) 0 0",
                  paddingTop: "var(--space-3)",
                  borderTop: "1px solid var(--color-hairline-soft)",
                  fontSize: "var(--text-caption)",
                  color: "var(--color-dusk-gray)",
                  lineHeight: "var(--leading-base)",
                }}
              >
                {state.prompt}
              </p>
            </details>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          title={`Your stance: ${state.initialStance}`}
          style={{
            ...FROSTED_BRIEF,
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-3)",
            maxWidth: "100%",
            borderRadius: "var(--radius-pill)",
            padding: "var(--space-3) var(--space-4)",
            cursor: "pointer",
            textAlign: "left",
            transition: "box-shadow var(--transition-fast)",
          }}
        >
          <span
            style={{
              ...EYEBROW,
              flexShrink: 0,
              color: "var(--color-dusk-gray)",
            }}
          >
            Your stance
          </span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: "var(--font-serif)",
              fontSize: "var(--text-body-sm)",
              color: "var(--color-graphite)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {state.initialStance}
          </span>
          <Chevron open={false} />
        </button>
      )}
    </div>
  );
}
