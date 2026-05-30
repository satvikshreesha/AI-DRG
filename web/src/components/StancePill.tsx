import { useState } from "react";
import { useSession } from "../state/SessionProvider";

type StancePillTab = "stance" | "prompt";

/**
 * A tabbed card anchored to the top-right of the active tab content area that
 * reminds the student of the prompt and initial stance they committed to. It
 * shows from the moment they finish the Gut Reaction until they save a thesis.
 */
export function StancePill() {
  const { state } = useSession();
  const [activeTab, setActiveTab] = useState<StancePillTab>("stance");

  if (!state.gutReactionComplete) return null;
  if (state.thesis.trim()) return null;
  if (!state.initialStance.trim()) return null;

  const tabLabelStyle = {
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontWeight: "var(--weight-medium)" as const,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 16,
        zIndex: 40,
        pointerEvents: "auto",
        width: 240,
        maxWidth: 240,
      }}
    >
      <div
        style={{
          background: "var(--color-paper-white)",
          border: "1px solid var(--color-hairline)",
          borderRadius: 12,
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--color-hairline)",
          }}
        >
          {(
            [
              { id: "stance" as const, label: "Your stance" },
              { id: "prompt" as const, label: "Prompt" },
            ] as const
          ).map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: isActive
                    ? "var(--color-paper-white)"
                    : "var(--color-parchment-elevated)",
                  border: "none",
                  borderTop: "1px solid var(--color-hairline)",
                  borderRight:
                    index === 0 ? "1px solid var(--color-hairline)" : "none",
                  borderBottom: isActive
                    ? "1px solid var(--color-paper-white)"
                    : "1px solid var(--color-hairline)",
                  marginBottom: isActive ? -1 : 0,
                  cursor: "pointer",
                  ...tabLabelStyle,
                  color: isActive
                    ? "var(--color-graphite)"
                    : "var(--color-faded-stone)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            padding: "14px 16px",
            fontSize: "var(--text-body-sm)",
            color: "var(--color-graphite)",
            lineHeight: 1.55,
          }}
        >
          {activeTab === "stance" ? state.initialStance : state.prompt}
        </div>
      </div>
    </div>
  );
}
