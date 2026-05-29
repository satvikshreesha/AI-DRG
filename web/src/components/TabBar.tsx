import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "../state/SessionProvider";
import type { TabKey } from "../state/types";
import { Logo } from "./Logo";
import { aiMode } from "../lib/ai";

const TAB_META: Record<TabKey, { label: string; icon: string; hint?: string }> =
  {
    "close-reading": {
      label: "Close Reading",
      icon: "📖",
      hint: "Read the text and capture quotes",
    },
    interpretation: {
      label: "Interpretation Canvas",
      icon: "✦",
      hint: "Organize evidence into themes",
    },
    thesis: {
      label: "Thesis Formation",
      icon: "◇",
      hint: "Draft and pressure-test your thesis",
    },
    structure: {
      label: "Essay Structure",
      icon: "▤",
      hint: "Arrange blocks into paragraphs",
    },
    writing: {
      label: "Essay Writing",
      icon: "✎",
      hint: "Draft the final essay",
    },
  };

const TAB_ORDER: TabKey[] = [
  "close-reading",
  "interpretation",
  "thesis",
  "structure",
  "writing",
];

type Props = {
  onExit: () => void;
};

export function TabBar({ onExit }: Props) {
  const {
    state,
    openTab,
    closeTab,
    setActiveTab,
    resetSession,
    skipToCloseReading,
  } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const structureHasContent = state.essaySections.some(
    (sec) => sec.blocks.length > 0
  );
  const isWritingLocked = !structureHasContent;

  const openableTabs: TabKey[] = TAB_ORDER.filter(
    (t) => !state.tabs.openTabs.includes(t)
  );

  const plusButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });

  // When the menu opens, anchor it to the "+" button using viewport coordinates
  // so it can escape the tab strip's overflow:auto container.
  useEffect(() => {
    if (!menuOpen) return;
    const update = () => {
      const r = plusButtonRef.current?.getBoundingClientRect();
      if (!r) return;
      setMenuPos({ left: r.left, top: r.bottom + 4 });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [menuOpen]);

  return (
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "flex-end",
        padding: "0 12px",
        background: "var(--color-parchment-elevated)",
        borderBottom: "1px solid var(--color-hairline)",
        position: "relative",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginRight: 16,
          paddingBottom: 10,
        }}
      >
        <Logo size={13} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          overflowX: "auto",
          overflowY: "visible",
        }}
      >
        {!state.gutReactionComplete ? (
          <div
            style={{
              position: "relative",
              padding: "8px 14px 8px 12px",
              fontSize: "var(--text-body-sm)",
              color: "var(--color-inkwell)",
              background: "var(--color-paper-white)",
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderLeft: "1px solid var(--color-hairline)",
              borderTop: "1px solid var(--color-hairline)",
              borderRight: "1px solid var(--color-hairline)",
              borderBottom: "1px solid var(--color-paper-white)",
              marginBottom: -1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              minWidth: 140,
              maxWidth: 200,
            }}
          >
            <span style={{ opacity: 0.7, fontSize: 11 }}>💭</span>
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Gut Reaction
            </span>
          </div>
        ) : (
          state.tabs.openTabs.map((tab) => {
          const isActive = tab === state.tabs.activeTab;
          const meta = TAB_META[tab];
          const canClose = state.tabs.openTabs.length > 1;
          return (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                position: "relative",
                padding: "8px 14px 8px 12px",
                fontSize: "var(--text-body-sm)",
                color: isActive
                  ? "var(--color-inkwell)"
                  : "var(--color-dusk-gray)",
                background: isActive
                  ? "var(--color-paper-white)"
                  : "transparent",
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderLeft: isActive
                  ? "1px solid var(--color-hairline)"
                  : "1px solid transparent",
                borderTop: isActive
                  ? "1px solid var(--color-hairline)"
                  : "1px solid transparent",
                borderRight: isActive
                  ? "1px solid var(--color-hairline)"
                  : "1px solid transparent",
                borderBottom: isActive
                  ? "1px solid var(--color-paper-white)"
                  : "1px solid transparent",
                marginBottom: -1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                minWidth: 140,
                maxWidth: 200,
                transition: "background var(--transition-fast)",
              }}
            >
              <span style={{ opacity: 0.7, fontSize: 11 }}>{meta.icon}</span>
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {meta.label}
              </span>
              {canClose && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab);
                  }}
                  aria-label={`Close ${meta.label}`}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-faded-stone)",
                    cursor: "pointer",
                    fontSize: 14,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })
        )}

        {state.gutReactionComplete && openableTabs.length > 0 && (
          <div
            style={{
              position: "relative",
              marginBottom: 6,
              marginLeft: 6,
              flexShrink: 0,
            }}
          >
            <button
              ref={plusButtonRef}
              type="button"
              aria-label="Open new tab"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((m) => !m);
              }}
              style={{
                background: menuOpen
                  ? "var(--color-paper-white)"
                  : "transparent",
                border: menuOpen
                  ? "1px solid var(--color-hairline)"
                  : "1px solid transparent",
                color: "var(--color-dusk-gray)",
                fontSize: 18,
                lineHeight: 1,
                cursor: "pointer",
                padding: "5px 10px",
                borderRadius: 6,
                width: 32,
                height: 30,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBottom: 10,
          marginLeft: 16,
        }}
      >
        <span
          title={
            aiMode === "live"
              ? "Connected to live OpenAI API"
              : "Using scripted demo responses (set VITE_OPENAI_API_KEY for live AI)"
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            borderRadius: "var(--radius-pill)",
            background:
              aiMode === "live"
                ? "var(--color-paper-white)"
                : "var(--color-parchment)",
            border: "1px solid var(--color-hairline)",
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color:
              aiMode === "live"
                ? "var(--color-graphite)"
                : "var(--color-faded-stone)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background:
                aiMode === "live"
                  ? "var(--color-status-green)"
                  : "var(--color-faded-stone)",
            }}
          />
          AI {aiMode}
        </span>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-faded-stone)",
            fontSize: "var(--text-caption)",
            cursor: "pointer",
            padding: "4px 10px",
            borderRadius: 6,
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onExit}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-faded-stone)",
            fontSize: "var(--text-caption)",
            cursor: "pointer",
            padding: "4px 10px",
            borderRadius: 6,
          }}
        >
          Exit
        </button>
      </div>

      {menuOpen &&
        openableTabs.length > 0 &&
        createPortal(
          <NewTabMenu
            anchor={menuPos}
            openableTabs={openableTabs}
            isWritingLocked={isWritingLocked}
            onPick={(tab) => {
              openTab(tab);
              setMenuOpen(false);
            }}
            onClose={() => setMenuOpen(false)}
          />,
          document.body
        )}

      {confirmReset && (
        <ConfirmResetModal
          onCancel={() => setConfirmReset(false)}
          onResetToGutReaction={() => {
            resetSession();
            setConfirmReset(false);
          }}
          onSkipToCloseReading={() => {
            skipToCloseReading();
            setConfirmReset(false);
          }}
        />
      )}
    </div>
  );
}

function NewTabMenu({
  anchor,
  openableTabs,
  isWritingLocked,
  onPick,
  onClose,
}: {
  anchor: { left: number; top: number };
  openableTabs: TabKey[];
  isWritingLocked: boolean;
  onPick: (tab: TabKey) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Defer so the click that opened the menu doesn't immediately close it.
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onDoc);
    }, 0);
    document.addEventListener("keydown", onEsc);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: "fixed",
        left: anchor.left,
        top: anchor.top,
        minWidth: 280,
        background: "var(--color-paper-white)",
        border: "1px solid var(--color-hairline)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        zIndex: 1000,
        padding: 4,
        animation: "fadeInUp 140ms ease-out",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-caption)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-faded-stone)",
          padding: "8px 10px 4px",
        }}
      >
        Open a tab
      </div>
      {openableTabs.map((tab) => {
        const meta = TAB_META[tab];
        const locked = tab === "writing" && isWritingLocked;
        return (
          <button
            key={tab}
            type="button"
            role="menuitem"
            disabled={locked}
            onClick={() => {
              if (locked) return;
              onPick(tab);
            }}
            title={
              locked
                ? "Add at least one block to Essay Structure to unlock Writing."
                : ""
            }
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid transparent",
              padding: "8px 10px",
              textAlign: "left",
              fontSize: "var(--text-body-sm)",
              color: locked
                ? "var(--color-faded-stone)"
                : "var(--color-inkwell)",
              cursor: locked ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 8,
            }}
            onMouseEnter={(e) => {
              if (!locked) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--color-parchment)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <span
              aria-hidden
              style={{ fontSize: 13, opacity: 0.7, width: 16, textAlign: "center" }}
            >
              {meta.icon}
            </span>
            <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "var(--weight-medium)" }}>
                {meta.label}
              </span>
              {meta.hint && (
                <span
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--color-faded-stone)",
                  }}
                >
                  {meta.hint}
                </span>
              )}
            </span>
            {locked && (
              <span
                style={{
                  fontSize: 10,
                  color: "var(--color-faded-stone)",
                  border: "1px solid var(--color-hairline)",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-pill)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                locked
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ConfirmResetModal({
  onCancel,
  onResetToGutReaction,
  onSkipToCloseReading,
}: {
  onCancel: () => void;
  onResetToGutReaction: () => void;
  onSkipToCloseReading: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(39,37,30,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-paper-white)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 460,
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: "var(--weight-medium)",
            marginBottom: 16,
          }}
        >
          Reset session
        </div>

        <button
          type="button"
          onClick={onResetToGutReaction}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-body-sm)",
              fontWeight: "var(--weight-medium)",
              marginBottom: 4,
            }}
          >
            Start at Gut Reaction
          </div>
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-dusk-gray)",
              lineHeight: 1.5,
            }}
          >
            Wipes everything and drops you back at the 30-second initial
            stance flow. Five highlights are still pre-seeded on the Masque
            text — they'll appear once you reach Close Reading.
          </div>
        </button>

        <button
          type="button"
          onClick={onSkipToCloseReading}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-body-sm)",
              fontWeight: "var(--weight-medium)",
              marginBottom: 4,
            }}
          >
            Skip Gut Reaction — open Close Reading
          </div>
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-dusk-gray)",
              lineHeight: 1.5,
            }}
          >
            Drops you straight into Close Reading with a pre-filled stance
            and the five seed highlights. Best when you want to demo the
            Interpretation Canvas / Thesis / Structure flow.
          </div>
        </button>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1px solid var(--color-hairline)",
              color: "var(--color-graphite)",
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              fontSize: "var(--text-body-sm)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
