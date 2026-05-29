import { useState } from "react";
import type { StoryEvent } from "./timeline.types";

type StoryTimelineProps = {
  events: StoryEvent[];
};

const TIMELINE_INSET_LEFT = 8;
const TIMELINE_ASIDE_WIDTH = 220;
const SPINE_X = 52;
const TRACK_TOP = 2;
const TRACK_BOTTOM = 98;
const FOCUS_TOP = 18;
const FOCUS_BOTTOM = 78;
const SEGMENT_HITBOX_LEFT = SPINE_X - 28;
const SEGMENT_HITBOX_WIDTH = 176;
const SUBPOINT_HITBOX_LEFT = SPINE_X - 18;
const SUBPOINT_HITBOX_WIDTH = 158;
const SUBPOINT_MARK_OFFSET = SPINE_X - SUBPOINT_HITBOX_LEFT;
const MAIN_LABEL_WIDTH = 132;
const SUBPOINT_LABEL_WIDTH = 126;
const TIMELINE_TRANSITION = "260ms cubic-bezier(0.22, 1, 0.36, 1)";

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
  const focusedEndIndex =
    focusedIndex >= 0 ? Math.min(focusedIndex + 1, events.length - 1) : -1;

  const getMainPosition = (eventIndex: number): number => {
    if (events.length === 1) return (TRACK_TOP + TRACK_BOTTOM) / 2;
    if (focusedIndex < 0) {
      return (
        TRACK_TOP +
        ((TRACK_BOTTOM - TRACK_TOP) / (events.length - 1)) * eventIndex
      );
    }

    if (eventIndex === focusedIndex) return FOCUS_TOP;
    if (eventIndex === focusedEndIndex) return FOCUS_BOTTOM;

    if (eventIndex < focusedIndex) {
      if (focusedIndex === 0) return TRACK_TOP;
      return (
        TRACK_TOP +
        ((FOCUS_TOP - TRACK_TOP) / focusedIndex) * eventIndex
      );
    }

    const afterCount = events.length - 1 - focusedEndIndex;
    if (afterCount <= 0) return TRACK_BOTTOM;
    return (
      FOCUS_BOTTOM +
      ((TRACK_BOTTOM - FOCUS_BOTTOM) / afterCount) *
        (eventIndex - focusedEndIndex)
    );
  };

  const getFocusEventIdForDot = (eventIndex: number) => {
    if (events.length <= 1) return events[eventIndex]?.id ?? null;
    if (eventIndex >= events.length - 1) return events[eventIndex - 1].id;
    return events[eventIndex].id;
  };

  const getSegmentIdAtPercent = (yPercent: number) => {
    if (yPercent < TRACK_TOP || yPercent > TRACK_BOTTOM) return null;
    for (let i = 0; i < events.length; i += 1) {
      const lo = getMainPosition(i);
      const hi =
        i < events.length - 1 ? getMainPosition(i + 1) : TRACK_BOTTOM;
      if (yPercent >= lo && yPercent <= hi) return events[i].id;
    }
    return null;
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
          const hitboxHeight = focused ? 40 : 32;
          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: toPercent(y),
                transform: "translateY(-50%)",
                height: hitboxHeight,
                transition: `top ${TIMELINE_TRANSITION}`,
                zIndex: 6,
              }}
            >
              <button
                type="button"
                onMouseEnter={() => {
                  setHoveredSegmentId(event.id);
                  setHoveredSubpointId(node.id);
                }}
                onMouseLeave={() => setHoveredSubpointId(null)}
                onClick={(eventClick) => {
                  eventClick.stopPropagation();
                  setFocusedSegmentId(event.id);
                  setActiveEventId(event.id);
                  scrollToAnchor(node.anchor);
                }}
                style={{
                  position: "absolute",
                  left: SUBPOINT_HITBOX_LEFT,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: SUBPOINT_HITBOX_WIDTH,
                  minHeight: hitboxHeight,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: `min-height ${TIMELINE_TRANSITION}`,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: SUBPOINT_MARK_OFFSET,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: showLabel ? 22 : 12,
                    height: 2,
                    background: showLabel
                      ? "var(--color-graphite)"
                      : "var(--color-faded-stone)",
                    transition: `all ${TIMELINE_TRANSITION}`,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    position: "absolute",
                    left: SUBPOINT_MARK_OFFSET + 28,
                    top: "50%",
                    transform: showLabel
                      ? "translate(0, -7px)"
                      : "translate(-4px, -7px)",
                    width: SUBPOINT_LABEL_WIDTH,
                    boxSizing: "border-box",
                    fontFamily: "var(--font-sans)",
                    fontSize: focused ? "var(--text-caption)" : 11,
                    lineHeight: "14px",
                    color: "var(--color-graphite)",
                    opacity: showLabel ? 1 : 0,
                    transition: `opacity ${TIMELINE_TRANSITION}, transform ${TIMELINE_TRANSITION}`,
                    whiteSpace: "normal",
                  }}
                >
                  {node.label}
                </span>
              </button>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <aside
      data-story-timeline
      onMouseLeave={() => {
        setHoveredSegmentId(null);
        setHoveredSubpointId(null);
      }}
      style={{
        position: "fixed",
        left: TIMELINE_INSET_LEFT,
        top: "50%",
        transform: "translateY(-50%)",
        width: TIMELINE_ASIDE_WIDTH,
        height: "88vh",
        maxHeight: "860px",
        minHeight: "760px",
        boxSizing: "border-box",
        padding: "0 8px",
        zIndex: 10,
      }}
      aria-label="Story timeline"
    >
      <div
        onMouseMove={(event) => {
          if (focusedSegmentId) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
          const insideHitArea =
            x >= SEGMENT_HITBOX_LEFT &&
            x <= SEGMENT_HITBOX_LEFT + SEGMENT_HITBOX_WIDTH;
          const nextSegmentId = insideHitArea
            ? getSegmentIdAtPercent(yPercent)
            : null;
          setHoveredSegmentId((current) =>
            current === nextSegmentId ? current : nextSegmentId
          );
        }}
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
              onClick={(eventClick) => {
                eventClick.stopPropagation();
                setActiveEventId(event.id);
                setFocusedSegmentId(event.id);
                setHoveredSegmentId(null);
                scrollToAnchor(event.anchor);
              }}
              style={{
                position: "absolute",
                left: SEGMENT_HITBOX_LEFT,
                width: SEGMENT_HITBOX_WIDTH,
                top: toPercent(lo),
                height: toPercent(Math.max(4, hi - lo)),
                cursor: "pointer",
                transition: `top ${TIMELINE_TRANSITION}, height ${TIMELINE_TRANSITION}`,
                zIndex: 2,
              }}
            />
          );
        })}

        {events.map((event, eventIndex) => {
          const position = getMainPosition(eventIndex);
          const inFocusedRange =
            focusedIndex >= 0 &&
            (eventIndex === focusedIndex || eventIndex === focusedEndIndex);
          const active =
            focusedIndex >= 0 ? inFocusedRange : activeEventId === event.id;
          const showMainLabel = focusedIndex < 0 || inFocusedRange;
          return (
            <div
              key={event.id}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: toPercent(position),
                transform: "translateY(-50%)",
                transition: `top ${TIMELINE_TRANSITION}`,
                zIndex: 5,
              }}
            >
              <button
                type="button"
                onClick={(eventClick) => {
                  eventClick.stopPropagation();
                  setActiveEventId(event.id);
                  setFocusedSegmentId(getFocusEventIdForDot(eventIndex));
                  setHoveredSegmentId(null);
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
                    background: "var(--color-paper-white)",
                    border: active
                      ? "1px solid var(--color-graphite)"
                      : "1px solid var(--color-faded-stone)",
                    transition: `all ${TIMELINE_TRANSITION}`,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    position: "absolute",
                    left: SPINE_X + 24,
                    top: "50%",
                    transform: showMainLabel
                      ? "translate(0, -8px)"
                      : "translate(-6px, -8px)",
                    width: MAIN_LABEL_WIDTH,
                    boxSizing: "border-box",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-body-sm)",
                    fontWeight: "var(--weight-regular)",
                    lineHeight: "16px",
                    color: active
                      ? "var(--color-graphite)"
                      : "var(--color-dusk-gray)",
                    opacity: showMainLabel ? 1 : 0,
                    transition: `color ${TIMELINE_TRANSITION}, opacity ${TIMELINE_TRANSITION}, transform ${TIMELINE_TRANSITION}`,
                    whiteSpace: "normal",
                  }}
                >
                  {event.label}
                </span>
              </button>
            </div>
          );
        })}

        {events.map((event, eventIndex) => {
          const subpointHovered = event.subEvents.some(
            (subEvent) => subEvent.id === hoveredSubpointId
          );
          const visible =
            focusedSegmentId
              ? focusedSegmentId === event.id
              : hoveredSegmentId === event.id || subpointHovered;
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
