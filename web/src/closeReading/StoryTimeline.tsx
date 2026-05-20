import React from "react";
import type { StoryEvent, SubEvent } from "./timeline.types";
import { useTimeline } from "./useTimeline";

type StoryTimelineProps = {
  events: StoryEvent[];
};

const TRANSITION = "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)";
/** 0 = mains stay on natural grid; 1 = full compression (previous behavior). */
const LAYOUT_BLEND = 0.28;

/** Percent of column height kept below the last main tick so sub-events can sit between it and the bottom. */
const TIMELINE_BOTTOM_RESERVE_PERCENT = 10;

/** Top of the reserved band at the bottom (main ticks span 0 … this value when there are 2+ events). */
const MAIN_TRACK_MAX = 100 - TIMELINE_BOTTOM_RESERVE_PERCENT;

/** Distance from viewport edge so the spine and ticks aren’t clipped or flush against the bezel. */
const TIMELINE_INSET_LEFT = 24;

/** Total width of the fixed rail (spine centered; ticks cross the spine). */
const TIMELINE_ASIDE_WIDTH = 168;

/**
 * When a sub-sub band is tight, enforce at least this much vertical separation (0–100 scale)
 * between sibling nested ticks so tap targets don’t overlap.
 */
const MIN_NESTED_SIBLING_GAP_PERCENT = 2.85;

const spineStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  width: 2,
  height: "100%",
  backgroundColor: "#d0d0d0",
};

const toPercent = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

/** Evenly space `count` ticks strictly between `lo` and `hi` (same rule as main→sub gaps). */
const distributeBetween = (lo: number, hi: number, index: number, count: number) => {
  const t = (index + 1) / (count + 1);
  return lo + t * (hi - lo);
};

const containsDescendant = (node: SubEvent, targetId: string): boolean => {
  if (node.id === targetId) return true;
  return (node.subEvents ?? []).some((c) => containsDescendant(c, targetId));
};

const findPinSiblingIndex = (nodes: SubEvent[], pinnedId: string): number | null => {
  const idx = nodes.findIndex((n) => n.id === pinnedId || containsDescendant(n, pinnedId));
  return idx >= 0 ? idx : null;
};

/**
 * Indices ≤ k use natural spacing to `hiNat`; indices > k compress into (yPin, hiAct].
 * When k is null, uses `hiAct` for all (previous behavior).
 */
const getPinnedAwareY = (
  lo: number,
  hiAct: number,
  hiNat: number,
  j: number,
  n: number,
  k: number | null
): number => {
  if (k === null) return distributeBetween(lo, hiAct, j, n);
  if (j <= k) return distributeBetween(lo, hiNat, j, n);
  const yPin = distributeBetween(lo, hiNat, k, n);
  const below = n - 1 - k;
  if (below <= 0) return yPin;
  const t = (j - k) / (below + 1);
  return yPin + t * (hiAct - yPin);
};

type TickLineProps = {
  width: number;
  color: string;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  ariaLabel: string;
  /** Larger padding / min size for nested ticks (better tap targets). */
  comfortableHit?: boolean;
};

const TickLine: React.FC<TickLineProps> = ({
  width,
  color,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  ariaLabel,
  comfortableHit = false,
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
    style={{
      margin: 0,
      padding: comfortableHit ? "16px 14px" : "10px 0",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: comfortableHit ? 48 : 44,
      minHeight: comfortableHit ? 48 : undefined,
      touchAction: "manipulation",
      transition: TRANSITION,
    }}
  >
    <span
      style={{
        display: "block",
        width,
        height: 2,
        backgroundColor: color,
        transition: TRANSITION,
        transform: hovered ? "scaleY(1.15)" : "scaleY(1)",
        transformOrigin: "center",
      }}
    />
  </button>
);

export const StoryTimeline: React.FC<StoryTimelineProps> = ({ events }) => {
  const {
    expandedEventId,
    compressionMainId,
    compressionPinnedBranchId,
    hoveredTickId,
    hoverGroupMainId,
    hoverBranchIds,
    setHoveredTickId,
    enterEventGroup,
    leaveEventGroup,
    enterBranchHover,
    leaveBranchHover,
    handleMainEventClick,
    handleBranchClick,
  } = useTimeline();

  if (events.length === 0) return null;

  const compressionIndex = compressionMainId
    ? events.findIndex((e) => e.id === compressionMainId)
    : -1;
  const compressionEvent = compressionIndex >= 0 ? events[compressionIndex] : null;
  const compressionSubCount = compressionEvent?.subEvents?.length ?? 0;
  const baseStep = events.length > 1 ? MAIN_TRACK_MAX / (events.length - 1) : 0;

  const getMainPositionFullCompressed = (eventIndex: number): number => {
    if (events.length === 1) return 50;
    if (!compressionEvent || eventIndex <= compressionIndex) return baseStep * eventIndex;
    const start = baseStep * compressionIndex;
    const eventsBelow = events.length - 1 - compressionIndex;
    const compressedStep = (100 - start) / (eventsBelow + compressionSubCount);
    return start + compressedStep * (compressionSubCount + (eventIndex - compressionIndex));
  };

  const getMainPosition = (eventIndex: number): number => {
    if (events.length === 1) return 50;
    const natural = baseStep * eventIndex;
    if (!compressionEvent || eventIndex <= compressionIndex) return natural;
    const full = getMainPositionFullCompressed(eventIndex);
    return natural + LAYOUT_BLEND * (full - natural);
  };

  const getMainNatural = (eventIndex: number): number => {
    if (events.length === 1) return 50;
    return baseStep * eventIndex;
  };

  const showSubsFor = (event: StoryEvent) =>
    expandedEventId === event.id || hoverGroupMainId === event.id;

  const isInHoveredSubtree = (node: SubEvent): boolean => {
    if (hoverBranchIds.has(node.id)) return true;
    return (node.subEvents ?? []).some(isInHoveredSubtree);
  };

  /** Nested ticks only on hover (no click-to-pin). Includes hover on this node or any deeper tick in its subtree. */
  const showNestedFor = (branch: SubEvent): boolean => {
    const nested = branch.subEvents ?? [];
    if (nested.length === 0) return false;
    return hoverBranchIds.has(branch.id) || nested.some(isInHoveredSubtree);
  };

  const renderBranchTicks = (
    event: StoryEvent,
    nodes: SubEvent[],
    lo: number,
    hiAct: number,
    hiNat: number,
    ancestorIds: string[],
    depth: number
  ): React.ReactNode => {
    if (nodes.length === 0) return null;

    const n = nodes.length;
    const minGap = depth >= 1 ? MIN_NESTED_SIBLING_GAP_PERCENT : 0;
    const needAct = (n + 1) * minGap;
    const spanAct = hiAct - lo;
    const effHiAct =
      minGap > 0 && spanAct < needAct ? lo + needAct : hiAct;
    const spanNat = hiNat - lo;
    const needNat = (n + 1) * minGap;
    const effHiNat =
      minGap > 0 && spanNat < needNat ? lo + needNat : hiNat;

    const pinApplies =
      event.id === compressionMainId && compressionPinnedBranchId !== null;
    const k = pinApplies
      ? findPinSiblingIndex(nodes, compressionPinnedBranchId)
      : null;

    return (
      <>
        {nodes.map((node, i) => {
          const y = getPinnedAwareY(lo, effHiAct, effHiNat, i, n, k);
          const nextAct =
            i + 1 < n ? distributeBetween(lo, effHiAct, i + 1, n) : effHiAct;
          const nextNat =
            i + 1 < n ? distributeBetween(lo, effHiNat, i + 1, n) : effHiNat;
          const nested = node.subEvents ?? [];
          const hasNested = nested.length > 0;
          const isHovered = hoveredTickId === node.id;
          const chain = [...ancestorIds, node.id];

          const widthDefault = depth === 0 ? 10 : depth === 1 ? 8 : Math.max(6, 8 - depth);
          const widthHover = depth === 0 ? 20 : depth === 1 ? 16 : Math.max(12, 16 - depth);
          const colorDefault = depth === 0 ? "#c4c4c4" : depth === 1 ? "#d8d8d8" : "#e8e8e8";
          const colorHover = depth === 0 ? "#4a4a4a" : depth === 1 ? "#6b6b6b" : "#7a7a7a";
          const labelSize = depth === 0 ? 11 : depth === 1 ? 10 : 9;
          const labelOffset = depth === 0 ? 18 : depth === 1 ? 16 : 14;
          const rowMinH = depth === 0 ? 28 : depth === 1 ? 36 : 32;
          const nestedComfortable = depth >= 1;

          const tickWidth = isHovered ? widthHover : widthDefault;
          const tickColor = isHovered ? colorHover : colorDefault;

          return (
            <React.Fragment key={node.id}>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: toPercent(y),
                  transform: "translate(-50%, -50%)",
                  width: "max-content",
                  maxWidth: "100%",
                  transition: TRANSITION,
                  zIndex: depth === 0 ? 3 : 2 + i,
                }}
              >
                <div
                  style={{
                    animation: "timelineSubFade 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <div
                    style={{ position: "relative", minHeight: rowMinH }}
                    onMouseEnter={() => {
                      enterEventGroup(event.id);
                      enterBranchHover(chain);
                    }}
                    onMouseLeave={() => {
                      if (expandedEventId !== event.id) {
                        leaveEventGroup(event.id);
                      }
                      leaveBranchHover(node.id);
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <TickLine
                        width={tickWidth}
                        color={tickColor}
                        hovered={isHovered}
                        ariaLabel={node.label}
                        comfortableHit={nestedComfortable}
                        onMouseEnter={() => setHoveredTickId(node.id)}
                        onMouseLeave={() => setHoveredTickId(null)}
                        onClick={() => handleBranchClick(node.anchor, event.id, node.id)}
                      />
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translateY(-50%)",
                        marginLeft: labelOffset,
                        opacity: isHovered ? 1 : 0,
                        pointerEvents: "none",
                        transition: TRANSITION,
                        color: "#1a1a1a",
                        whiteSpace: "nowrap",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: labelSize,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {node.label}
                    </span>
                  </div>
                </div>
              </div>

              {hasNested &&
                showNestedFor(node) &&
                renderBranchTicks(event, nested, y, nextAct, nextNat, chain, depth + 1)}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: TIMELINE_INSET_LEFT,
        top: "50%",
        transform: "translateY(-50%)",
        width: TIMELINE_ASIDE_WIDTH,
        height: "78vh",
        boxSizing: "border-box",
        padding: "0 10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        zIndex: 10,
      }}
      aria-label="Story timeline"
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div style={spineStyle} />

        {events.map((event, eventIndex) => {
          const isExpanded = expandedEventId === event.id;
          const isHovered = hoveredTickId === event.id;
          const position = getMainPosition(eventIndex);

          const mainWidthDefault = 16;
          const mainWidthHover = 30;
          const mainWidthExpanded = 22;

          const mainColorDefault = "#b3b3b3";
          const mainColorHover = "#141414";
          const mainColorExpanded = "#27251e";

          let mainWidth = mainWidthDefault;
          let mainColor = mainColorDefault;
          if (isExpanded) {
            mainWidth = mainWidthExpanded;
            mainColor = mainColorExpanded;
          } else if (isHovered) {
            mainWidth = mainWidthHover;
            mainColor = mainColorHover;
          }

          return (
            <div
              key={event.id}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: toPercent(position),
                transform: "translateY(-50%)",
                transition: TRANSITION,
              }}
            >
              <div
                style={{ position: "relative", width: "100%", minHeight: 32 }}
                onMouseEnter={() => enterEventGroup(event.id)}
                onMouseLeave={() => leaveEventGroup(event.id)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <TickLine
                    width={mainWidth}
                    color={mainColor}
                    hovered={isHovered}
                    ariaLabel={event.label}
                    onMouseEnter={() => setHoveredTickId(event.id)}
                    onMouseLeave={() => setHoveredTickId(null)}
                    onClick={() => handleMainEventClick(event.id, event.anchor)}
                  />
                </div>
                <span
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    marginLeft: 22,
                    opacity: 1,
                    pointerEvents: "none",
                    transition: TRANSITION,
                    color: isHovered || isExpanded ? "#0a0a0a" : "#3d3d3d",
                    whiteSpace: "nowrap",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.04em",
                  }}
                >
                  {event.label}
                </span>
              </div>
            </div>
          );
        })}

        {events.map((event, eventIndex) => {
          const subs = event.subEvents ?? [];
          if (!showSubsFor(event) || subs.length === 0) return null;
          const lo = getMainPosition(eventIndex);
          const hiAct =
            eventIndex < events.length - 1 ? getMainPosition(eventIndex + 1) : 100;
          const hiNat =
            eventIndex < events.length - 1 ? getMainNatural(eventIndex + 1) : 100;
          return (
            <React.Fragment key={`${event.id}-branches`}>
              {renderBranchTicks(event, subs, lo, hiAct, hiNat, [], 0)}
            </React.Fragment>
          );
        })}

        <style>
          {`
            @keyframes timelineSubFade {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </div>
    </aside>
  );
};

export default StoryTimeline;
