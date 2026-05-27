import { useState } from "react";
import type { StoryEvent } from "./timeline.types";

type StoryTimelineProps = {
  events: StoryEvent[];
};

const TIMELINE_INSET_LEFT = 24;
const TIMELINE_ASIDE_WIDTH = 240;
const SPINE_X = 64;
const TRACK_TOP = 4;
const TRACK_BOTTOM = 96;
const FOCUS_TOP = 22;
const FOCUS_BOTTOM = 78;
const SPINE_HITBOX_WIDTH = 18;

const toPercent = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

const distributeBetween = (
  lo: number,
  hi: number,
  index: number,
  count: number
) => {
  const t = (index + 1) / (count + 1);
  return lo + t * (hi - lo);
};

const scrollToAnchor = (anchor: string) => {
  const element = document.getElementById(anchor);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const StoryTimeline = ({ events }: StoryTimelineProps) => {
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [focusedSegmentId, setFocusedSegmentId] = useState<string | null>(null);
  const [hoveredSubpointId, setHoveredSubpointId] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  if (events.length === 0) return null;

  const focusedIndex = focusedSegmentId
    ? events.findIndex((event) => event.id === focusedSegmentId)
    : -1;

  const getMainPosition = (eventIndex: number): number => {
    if (events.length === 1) return (TRACK_TOP + TRACK_BOTTOM) / 2;
    if (focusedIndex < 0) {
      return (
        TRACK_TOP +
        ((TRACK_BOTTOM - TRACK_TOP) / (events.length - 1)) * eventIndex
      );
    }

    const nextFocusedIndex = Math.min(focusedIndex + 1, events.length - 1);
    if (eventIndex === focusedIndex) return FOCUS_TOP;
    if (eventIndex === nextFocusedIndex) return FOCUS_BOTTOM;

    if (eventIndex < focusedIndex) {
      if (focusedIndex === 0) return TRACK_TOP;
      return (
        TRACK_TOP +
        ((FOCUS_TOP - TRACK_TOP) / focusedIndex) * eventIndex
      );
    }

    const afterCount = events.length - 1 - nextFocusedIndex;
    if (afterCount <= 0) return TRACK_BOTTOM;
    return (
      FOCUS_BOTTOM +
      ((TRACK_BOTTOM - FOCUS_BOTTOM) / afterCount) *
        (eventIndex - nextFocusedIndex)
    );
  };

  const renderSubpoints = (event: StoryEvent, lo: number, hi: number) => {
    const nodes = event.subEvents ?? [];
    if (nodes.length === 0) return null;
    const focused = focusedSegmentId === event.id;

    return (
      <>
        {nodes.map((node, i) => {
          const y = distributeBetween(lo, hi, i, nodes.length);
          const showLabel = focused || hoveredSubpointId === node.id;
          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: toPercent(y),
                transform: "translateY(-50%)",
                height: focused ? 34 : 24,
                zIndex: 6,
              }}
            >
              <button
                type="button"
                onMouseEnter={() => setHoveredSubpointId(node.id)}
                onMouseLeave={() => setHoveredSubpointId(null)}
                onClick={(eventClick) => {
                  eventClick.stopPropagation();
                  setFocusedSegmentId(event.id);
                  setActiveEventId(event.id);
                  scrollToAnchor(node.anchor);
                }}
                style={{
                  position: "absolute",
                  left: SPINE_X - SPINE_HITBOX_WIDTH / 2,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: focused ? 150 : SPINE_HITBOX_WIDTH,
                  minHeight: focused ? 28 : 20,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: SPINE_HITBOX_WIDTH / 2,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: showLabel ? 22 : 12,
                    height: 2,
                    background: showLabel
                      ? "var(--color-graphite)"
                      : "var(--color-faded-stone)",
                    transition: "all var(--transition-base)",
                  }}
                />
                {showLabel && (
                  <span
                    style={{
                      display: "block",
                      paddingLeft: 36,
                      fontFamily: "var(--font-sans)",
                      fontSize: focused ? "var(--text-caption)" : 11,
                      lineHeight: "14px",
                      color: "var(--color-graphite)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {node.label}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <aside
      onClick={() => {
        setFocusedSegmentId(null);
        setHoveredSegmentId(null);
        setHoveredSubpointId(null);
      }}
      style={{
        position: "fixed",
        left: TIMELINE_INSET_LEFT,
        top: "50%",
        transform: "translateY(-50%)",
        width: TIMELINE_ASIDE_WIDTH,
        height: "78vh",
        boxSizing: "border-box",
        padding: "0 8px",
        zIndex: 10,
      }}
      aria-label="Story timeline"
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: SPINE_X,
            top: 0,
            width: 1,
            height: "100%",
            backgroundColor: "var(--color-hairline)",
          }}
        />

        {events.map((event, eventIndex) => {
          const lo = getMainPosition(eventIndex);
          const hi =
            eventIndex < events.length - 1
              ? getMainPosition(eventIndex + 1)
              : TRACK_BOTTOM;
          return (
            <div
              key={`${event.id}-segment-hitbox`}
              onMouseEnter={() => setHoveredSegmentId(event.id)}
              onMouseLeave={() => setHoveredSegmentId(null)}
              style={{
                position: "absolute",
                left: SPINE_X - SPINE_HITBOX_WIDTH / 2,
                width: SPINE_HITBOX_WIDTH,
                top: toPercent(lo),
                height: toPercent(Math.max(4, hi - lo)),
                zIndex: 2,
              }}
            />
          );
        })}

        {events.map((event, eventIndex) => {
          const position = getMainPosition(eventIndex);
          const active = activeEventId === event.id || focusedSegmentId === event.id;
          return (
            <div
              key={event.id}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: toPercent(position),
                transform: "translateY(-50%)",
                zIndex: 5,
              }}
            >
              <button
                type="button"
                onClick={(eventClick) => {
                  eventClick.stopPropagation();
                  setActiveEventId(event.id);
                  scrollToAnchor(event.anchor);
                }}
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: 34,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: SPINE_X,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: active ? 12 : 9,
                    height: active ? 12 : 9,
                    borderRadius: "50%",
                    background: active
                      ? "var(--color-graphite)"
                      : "var(--color-paper-white)",
                    border: active
                      ? "1px solid var(--color-graphite)"
                      : "1px solid var(--color-faded-stone)",
                    boxShadow: "0 0 0 4px #f1f1ef",
                    transition: "all var(--transition-base)",
                  }}
                />
                <span
                  style={{
                    display: "block",
                    paddingLeft: SPINE_X + 24,
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-body-sm)",
                    fontWeight: "var(--weight-regular)",
                    lineHeight: "16px",
                    color: active
                      ? "var(--color-graphite)"
                      : "var(--color-dusk-gray)",
                  }}
                >
                  {event.label}
                </span>
              </button>
            </div>
          );
        })}

        {events.map((event, eventIndex) => {
          const visible =
            hoveredSegmentId === event.id || focusedSegmentId === event.id;
          if (!visible) return null;
          const lo = getMainPosition(eventIndex);
          const hi =
            eventIndex < events.length - 1
              ? getMainPosition(eventIndex + 1)
              : TRACK_BOTTOM;
          return renderSubpoints(event, lo, hi);
        })}
      </div>
    </aside>
  );
};

export default StoryTimeline;
