import { useCallback, useEffect, useRef, useState } from "react";

const HOVER_GROUP_LEAVE_MS = 100;
/** Shorter than main-group delay so nested ticks don’t feel like they stick after pointer exit. */
const BRANCH_HOVER_LEAVE_MS = 45;

type UseTimelineResult = {
  expandedEventId: string | null;
  /** Main beat used for compressing ticks below (expanded main and/or parent of last sub click). */
  compressionMainId: string | null;
  /** Branch id last clicked under that main; stays on natural layout, only ticks below compress. */
  compressionPinnedBranchId: string | null;
  hoveredTickId: string | null;
  hoverGroupMainId: string | null;
  hoverBranchIds: ReadonlySet<string>;
  setHoveredTickId: (id: string | null) => void;
  enterEventGroup: (mainId: string) => void;
  leaveEventGroup: (mainId: string) => void;
  /** Marks this node and its ancestors as hovered so nested labels stay open while pointer moves into deeper ticks. */
  enterBranchHover: (branchIdChain: string[]) => void;
  leaveBranchHover: (branchId: string) => void;
  handleMainEventClick: (eventId: string, anchor: string) => void;
  handleBranchClick: (anchor: string, parentMainId: string, branchId: string) => void;
};

const scrollToAnchor = (anchor: string) => {
  const element = document.getElementById(anchor);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const useTimeline = (): UseTimelineResult => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [compressionMainId, setCompressionMainId] = useState<string | null>(null);
  const [compressionPinnedBranchId, setCompressionPinnedBranchId] = useState<string | null>(null);
  const [hoveredTickId, setHoveredTickId] = useState<string | null>(null);
  const [hoverGroupMainId, setHoverGroupMainId] = useState<string | null>(null);
  const [hoverBranchIds, setHoverBranchIds] = useState<ReadonlySet<string>>(() => new Set());
  const hoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const branchHoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverLeaveTimer = useCallback(() => {
    if (hoverClearTimerRef.current !== null) {
      clearTimeout(hoverClearTimerRef.current);
      hoverClearTimerRef.current = null;
    }
  }, []);

  const clearBranchHoverLeaveTimer = useCallback(() => {
    if (branchHoverClearTimerRef.current !== null) {
      clearTimeout(branchHoverClearTimerRef.current);
      branchHoverClearTimerRef.current = null;
    }
  }, []);

  const enterEventGroup = useCallback(
    (mainId: string) => {
      clearHoverLeaveTimer();
      setHoverGroupMainId(mainId);
    },
    [clearHoverLeaveTimer]
  );

  const leaveEventGroup = useCallback(
    (mainId: string) => {
      clearHoverLeaveTimer();
      hoverClearTimerRef.current = setTimeout(() => {
        setHoverGroupMainId((current) => (current === mainId ? null : current));
        hoverClearTimerRef.current = null;
      }, HOVER_GROUP_LEAVE_MS);
    },
    [clearHoverLeaveTimer]
  );

  const enterBranchHover = useCallback(
    (branchIdChain: string[]) => {
      clearBranchHoverLeaveTimer();
      if (branchIdChain.length === 0) return;
      setHoverBranchIds((prev) => new Set([...prev, ...branchIdChain]));
    },
    [clearBranchHoverLeaveTimer]
  );

  const leaveBranchHover = useCallback(
    (branchId: string) => {
      clearBranchHoverLeaveTimer();
      branchHoverClearTimerRef.current = setTimeout(() => {
        setHoverBranchIds((prev) => {
          const next = new Set(prev);
          next.delete(branchId);
          return next;
        });
        branchHoverClearTimerRef.current = null;
      }, BRANCH_HOVER_LEAVE_MS);
    },
    [clearBranchHoverLeaveTimer]
  );

  useEffect(
    () => () => {
      clearHoverLeaveTimer();
      clearBranchHoverLeaveTimer();
    },
    [clearHoverLeaveTimer, clearBranchHoverLeaveTimer]
  );

  const handleMainEventClick = useCallback((eventId: string, anchor: string) => {
    scrollToAnchor(anchor);
    setCompressionPinnedBranchId(null);
    setExpandedEventId((prevExpanded) => {
      const collapsing = prevExpanded === eventId;
      const nextExpanded = collapsing ? null : eventId;
      setCompressionMainId((prevCompression) => {
        if (collapsing) {
          return prevCompression === eventId ? null : prevCompression;
        }
        return eventId;
      });
      return nextExpanded;
    });
  }, []);

  const handleBranchClick = useCallback((anchor: string, parentMainId: string, branchId: string) => {
    scrollToAnchor(anchor);
    setCompressionMainId(parentMainId);
    setCompressionPinnedBranchId(branchId);
  }, []);

  return {
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
  };
};
