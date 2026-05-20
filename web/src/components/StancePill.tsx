import { useEffect, useRef, useState } from "react";
import { useSession } from "../state/SessionProvider";

/**
 * A small pill anchored to the top-right of the active tab content area that
 * reminds the student of the initial stance they committed to. It shows from
 * the moment they finish the Gut Reaction until they save a thesis.
 */
export function StancePill() {
  const { state } = useSession();
  const [expanded, setExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const onDoc = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    };
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onDoc);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [expanded]);

  if (!state.gutReactionComplete) return null;
  if (state.thesis.trim()) return null;
  if (!state.initialStance.trim()) return null;

  const truncated =
    state.initialStance.length > 70
      ? `${state.initialStance.slice(0, 70).trim()}…`
      : state.initialStance;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "absolute",
        top: 12,
        right: 16,
        zIndex: 40,
        pointerEvents: "auto",
      }}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            maxWidth: 320,
            padding: "6px 12px",
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-pill)",
            fontSize: "var(--text-caption)",
            color: "var(--color-graphite)",
            cursor: "pointer",
            boxShadow: "var(--shadow-soft)",
          }}
          title="Click to see your full initial stance"
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-faded-stone)",
              whiteSpace: "nowrap",
            }}
          >
            Your stance
          </span>
          <span
            style={{
              width: 1,
              height: 12,
              background: "var(--color-hairline)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--color-dusk-gray)",
              fontStyle: "italic",
            }}
          >
            {truncated}
          </span>
        </button>
      ) : (
        <div
          style={{
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 12,
            padding: 14,
            boxShadow: "var(--shadow-card)",
            animation: "fadeInUp 160ms ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-faded-stone)",
              }}
            >
              Your initial stance
            </span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Collapse"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-faded-stone)",
                cursor: "pointer",
                fontSize: 13,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              fontSize: "var(--text-body-sm)",
              color: "var(--color-graphite)",
              lineHeight: 1.55,
              fontStyle: "italic",
            }}
          >
            “{state.initialStance}”
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: "var(--text-caption)",
              color: "var(--color-faded-stone)",
            }}
          >
            This reminder hides once you save a thesis.
          </div>
        </div>
      )}
    </div>
  );
}
