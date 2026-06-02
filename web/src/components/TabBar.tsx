import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSession } from "../state/SessionProvider";
import type { TabKey } from "../state/types";
import { Logo } from "./Logo";

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

const WRITING_LOCKED_HINT =
  "Essay Writing isn't available until you've written your Essay Structure.";

/* ── Inactive tab appearance ───────────────────────────────
 * Two distinct visual languages so the states read at a glance:
 *
 *   OPENABLE  dashed gray border · 50% opacity fill · circular "+" badge
 *             → "available, click to add"
 *   LOCKED    solid muted border · flat gray fill · "Locked" pill
 *             → "blocked, not clickable yet"
 * ─────────────────────────────────────────────────────────── */
const INACTIVE_TAB = {
  openable: {
    border: "1px dashed var(--color-hairline)",
    borderHover: "1px dashed var(--color-hairline)",
    background: "var(--color-paper-white)",
    backgroundHover: "var(--color-parchment)",
    opacity: 0.6,
    opacityHover: 1,
    label: "var(--color-dusk-gray)",
    iconOpacity: 0.75,
  },
  locked: {
    border: "1px solid var(--color-hairline-soft)",
    background: "var(--color-parchment-elevated)",
    label: "var(--color-faded-stone)",
    iconOpacity: 0.4,
  },
} as const;

export const TAB_BAR_HEIGHT = 44;

type Props = {
  onExit: () => void;
};

export function TabBar({ onExit }: Props) {
  const { state, openTab, closeTab, setActiveTab, resetSession, skipToCloseReading } =
    useSession();
  const [confirmReset, setConfirmReset] = useState(false);

  const structureHasContent = state.essaySections.some(
    (sec) => sec.blocks.length > 0
  );
  const isWritingLocked = !structureHasContent;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: TAB_BAR_HEIGHT,
        display: "flex",
        alignItems: "flex-end",
        padding: "0 12px",
        background: "var(--color-parchment-elevated)",
        borderBottom: "1px solid var(--color-hairline)",
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
          minWidth: 0,
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          overflow: "hidden",
        }}
      >
        {!state.gutReactionComplete ? (
          <GutReactionTab />
        ) : (
          TAB_ORDER.map((tab) => {
            const isOpen = state.tabs.openTabs.includes(tab);
            if (isOpen) {
              return (
                <OpenTab
                  key={tab}
                  tab={tab}
                  isActive={tab === state.tabs.activeTab}
                  canClose={state.tabs.openTabs.length > 1}
                  onSelect={() => setActiveTab(tab)}
                  onClose={() => closeTab(tab)}
                />
              );
            }
            return (
              <ClosedTab
                key={tab}
                tab={tab}
                locked={tab === "writing" && isWritingLocked}
                onOpen={() => openTab(tab)}
              />
            );
          })
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

function GutReactionTab() {
  return (
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
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
        Gut Reaction
      </span>
    </div>
  );
}

function OpenTab({
  tab,
  isActive,
  canClose,
  onSelect,
  onClose,
}: {
  tab: TabKey;
  isActive: boolean;
  canClose: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const meta = TAB_META[tab];
  return (
    <TabHoverShell hint={meta.hint}>
      <div
        onClick={onSelect}
        style={{
          position: "relative",
          padding: "8px 14px 8px 12px",
          fontSize: "var(--text-body-sm)",
          color: isActive ? "var(--color-inkwell)" : "var(--color-dusk-gray)",
          background: isActive ? "var(--color-paper-white)" : "transparent",
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
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {meta.label}
        </span>
        {canClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
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
    </TabHoverShell>
  );
}

function ClosedTab({
  tab,
  locked,
  onOpen,
}: {
  tab: TabKey;
  locked: boolean;
  onOpen: () => void;
}) {
  const meta = TAB_META[tab];
  const [hovered, setHovered] = useState(false);

  if (locked) {
    const appearance = INACTIVE_TAB.locked;
    const hint = meta.hint
      ? `${meta.hint}. ${WRITING_LOCKED_HINT}`
      : WRITING_LOCKED_HINT;
    return (
      <TabHoverShell hint={hint}>
        <div
          aria-disabled
          aria-label={`${meta.label} — locked`}
          style={{
            position: "relative",
            padding: "8px 12px",
            fontSize: "var(--text-body-sm)",
            color: appearance.label,
            background: appearance.background,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            border: appearance.border,
            marginBottom: -1,
            cursor: "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
            minWidth: 140,
            maxWidth: 210,
          }}
        >
          <span style={{ opacity: appearance.iconOpacity, fontSize: 11 }}>
            {meta.icon}
          </span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
            {meta.label}
          </span>
          <LockedBadge />
        </div>
      </TabHoverShell>
    );
  }

  const appearance = INACTIVE_TAB.openable;
  return (
    <TabHoverShell hint={meta.hint}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${meta.label}`}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          padding: "8px 12px",
          fontSize: "var(--text-body-sm)",
          color: appearance.label,
          background: hovered ? appearance.backgroundHover : appearance.background,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          border: hovered ? appearance.borderHover : appearance.border,
          marginBottom: -1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
          minWidth: 140,
          maxWidth: 210,
          opacity: hovered ? appearance.opacityHover : appearance.opacity,
          transition:
            "background var(--transition-fast), border-color var(--transition-fast), opacity var(--transition-fast)",
        }}
      >
        <span style={{ opacity: appearance.iconOpacity, fontSize: 11 }}>
          {meta.icon}
        </span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {meta.label}
        </span>
        <PlusBadge />
      </div>
    </TabHoverShell>
  );
}

function PlusBadge() {
  return (
    <span
      aria-hidden
      style={{
        width: 18,
        height: 18,
        borderRadius: "var(--radius-pill)",
        background: "var(--color-parchment)",
        color: "var(--color-dusk-gray)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        lineHeight: 1,
        fontWeight: "var(--weight-medium)",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    >
      +
    </span>
  );
}

function LockedBadge() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        height: 18,
        padding: "0 6px",
        borderRadius: "var(--radius-pill)",
        background: "var(--color-paper-white)",
        border: "1px solid var(--color-hairline)",
        fontSize: 9,
        lineHeight: 1,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-faded-stone)",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    >
      <LockIcon size={8} />
      Locked
    </span>
  );
}

function TabHoverShell({
  hint,
  children,
}: {
  hint?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [anchor, setAnchor] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!hovered || !hint || !ref.current) return;
    const update = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({ left: rect.left + rect.width / 2, top: rect.bottom + 8 });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [hovered, hint]);

  return (
    <>
      <div
        ref={ref}
        style={{ position: "relative" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {children}
      </div>
      {hovered &&
        hint &&
        createPortal(
          <TabTooltip text={hint} anchor={anchor} />,
          document.body
        )}
    </>
  );
}

function TabTooltip({
  text,
  anchor,
}: {
  text: string;
  anchor: { left: number; top: number };
}) {
  return (
    <div
      role="tooltip"
      style={{
        position: "fixed",
        left: anchor.left,
        top: anchor.top,
        transform: "translateX(-50%)",
        width: "max-content",
        maxWidth: 240,
        padding: "8px 10px",
        borderRadius: 8,
        background: "var(--color-graphite)",
        color: "var(--color-paper-white)",
        fontSize: "var(--text-caption)",
        lineHeight: 1.45,
        textAlign: "center",
        boxShadow: "var(--shadow-card)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{ color: "currentColor", flexShrink: 0 }}
    >
      <rect
        x="2.25"
        y="5.25"
        width="7.5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M4.25 5.25V3.75a1.75 1.75 0 113.5 0V5.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
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
