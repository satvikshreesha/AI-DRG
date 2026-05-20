import { useEffect, useRef, useState } from "react";
import type { AnnotationCard, CardStatus } from "../state/types";
import type { PassageHighlight } from "../closeReading/highlightTypes";

export const CARD_WIDTH = 230;
export const CARD_HEIGHT_FULL = 220;
export const CARD_HEIGHT_MIN = 110;

const STATUS_COLORS: Record<CardStatus, string> = {
  unset: "var(--color-status-grey)",
  green: "var(--color-status-green)",
  yellow: "var(--color-status-yellow)",
  red: "var(--color-status-red)",
};

const STATUS_LABELS: Record<CardStatus, string> = {
  unset: "Mark how likely you are to use this",
  green: "Strong — likely to use",
  yellow: "Maybe — keep in reserve",
  red: "Unlikely to use",
};

type Props = {
  card: AnnotationCard;
  highlight: PassageHighlight;
  selected: boolean;
  connecting: boolean;
  /** Card is the staged start of a connection (waiting for the second click). */
  pendingConnectionStart: boolean;
  hovered: boolean;
  toolMode: "pointer" | "group" | "connect";
  onPointerDown: (e: React.PointerEvent) => void;
  onCardClick: (e: React.MouseEvent) => void;
  onSetStatus: (s: CardStatus) => void;
  onToggleMinimize: () => void;
};

function minimizeQuote(quote: string): string {
  if (quote.length <= 70) return quote;
  const first = quote.split(" ").slice(0, 4).join(" ");
  const last = quote.split(" ").slice(-4).join(" ");
  return `${first}\u2026 ${last}`;
}

export function AnnotationCardView({
  card,
  highlight,
  selected,
  connecting,
  pendingConnectionStart,
  hovered,
  toolMode,
  onPointerDown,
  onCardClick,
  onSetStatus,
  onToggleMinimize,
}: Props) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [statusMenuOpen]);

  const minimized = card.minimized;
  const displayQuote = minimized ? minimizeQuote(highlight.quote) : highlight.quote;

  const borderColor = pendingConnectionStart
    ? "var(--color-graphite)"
    : selected || hovered
      ? "var(--color-accent-teal-border)"
      : "var(--color-hairline)";

  const boxShadow = selected
    ? "0 0 0 1px var(--color-accent-teal-border)"
    : "var(--shadow-soft)";

  const cursor =
    toolMode === "connect"
      ? "crosshair"
      : toolMode === "group"
        ? "default"
        : "grab";

  return (
    <div
      data-card-id={card.id}
      onPointerDown={onPointerDown}
      onClick={onCardClick}
      style={{
        position: "absolute",
        left: card.x,
        top: card.y,
        width: CARD_WIDTH,
        minHeight: minimized ? CARD_HEIGHT_MIN : CARD_HEIGHT_FULL,
        background: "var(--color-paper-white)",
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        boxShadow,
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        cursor,
        transition:
          "border-color var(--transition-fast), box-shadow var(--transition-fast)",
        outline: pendingConnectionStart
          ? "2px solid var(--color-graphite)"
          : "none",
        outlineOffset: pendingConnectionStart ? 2 : 0,
      }}
    >
      {/* Layer 1: toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
        }}
      >
        <div ref={statusRef} style={{ position: "relative" }}>
          <button
            type="button"
            aria-label={STATUS_LABELS[card.status]}
            onClick={(e) => {
              e.stopPropagation();
              setStatusMenuOpen((m) => !m);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: STATUS_COLORS[card.status],
                border: "1px solid rgba(0,0,0,0.08)",
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--color-faded-stone)", fontSize: 10 }}>▾</span>
          </button>
          {statusMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 22,
                left: 0,
                minWidth: 170,
                background: "var(--color-paper-white)",
                border: "1px solid var(--color-hairline)",
                borderRadius: 10,
                boxShadow: "var(--shadow-card)",
                padding: 4,
                zIndex: 50,
              }}
            >
              {(["unset", "green", "yellow", "red"] as CardStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(s);
                    setStatusMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "6px 8px",
                    background:
                      card.status === s ? "var(--color-parchment)" : "transparent",
                    border: "none",
                    borderRadius: 6,
                    fontSize: "var(--text-body-sm)",
                    color: "var(--color-graphite)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: STATUS_COLORS[s],
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  <span style={{ fontSize: 12 }}>{STATUS_LABELS[s]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={minimized ? "Maximize" : "Minimize"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMinimize();
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-faded-stone)",
            cursor: "pointer",
            padding: 0,
            fontSize: 12,
          }}
        >
          {minimized ? "⤢" : "⤡"}
        </button>
      </div>

      {/* Layer 2: quote */}
      <div
        style={{
          padding: "2px 12px",
          fontSize: "var(--text-body-sm)",
          color: "var(--color-dusk-gray)",
          lineHeight: 1.5,
          fontStyle: "italic",
          flex: minimized ? "none" : 1,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: minimized ? 2 : 6,
        }}
      >
        “{displayQuote}”
      </div>

      <div
        style={{
          height: 1,
          background: "var(--color-hairline-soft)",
          margin: "8px 12px",
        }}
      />

      {/* Layer 3: annotation */}
      <div
        style={{
          padding: "0 12px 12px",
          fontSize: "var(--text-body-sm)",
          color: "var(--color-graphite)",
          lineHeight: 1.5,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: minimized ? 2 : 4,
        }}
      >
        {highlight.note || (
          <span style={{ color: "var(--color-faded-stone)" }}>
            (no annotation)
          </span>
        )}
      </div>

      {connecting && pendingConnectionStart && (
        <div
          style={{
            position: "absolute",
            bottom: -22,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "var(--text-caption)",
            color: "var(--color-faded-stone)",
            whiteSpace: "nowrap",
          }}
        >
          Click another card to connect
        </div>
      )}
    </div>
  );
}
