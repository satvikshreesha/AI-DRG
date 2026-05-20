import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "../state/SessionProvider";
import {
  AnnotationCardView,
  CARD_HEIGHT_FULL,
  CARD_HEIGHT_MIN,
  CARD_WIDTH,
} from "./AnnotationCard";
import type { AnnotationCard } from "../state/types";

type Tool = "pointer" | "group" | "connect";

type DragState = {
  cardId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  moved: boolean;
};

type GroupDragState = {
  startX: number;
  startY: number;
  curX: number;
  curY: number;
};

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1600;

export function InterpretationCanvas() {
  const {
    state,
    moveCard,
    setCardStatus,
    toggleCardMinimized,
    resetCanvas,
    addGroup,
    renameGroup,
    removeGroup,
    addConnection,
    renameConnection,
    removeConnection,
  } = useSession();

  const [tool, setTool] = useState<Tool>("pointer");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [pendingConnectionStart, setPendingConnectionStart] = useState<
    string | null
  >(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renamingConnectionId, setRenamingConnectionId] = useState<string | null>(
    null
  );

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  /** Set on pointerup; consumed by the next click event so a drag doesn't also count as a click. */
  const justDraggedRef = useRef(false);
  const [groupDrag, setGroupDrag] = useState<GroupDragState | null>(null);

  /* Card height lookup so connectors point at the actual center. */
  const cardHeight = useCallback(
    (card: AnnotationCard) =>
      card.minimized ? CARD_HEIGHT_MIN : CARD_HEIGHT_FULL,
    []
  );

  /* ---------- Card pointer drag ---------- */
  const onCardPointerDown = useCallback(
    (cardId: string, e: React.PointerEvent) => {
      if (tool !== "pointer") return;
      const target = e.target as HTMLElement;
      // Ignore drags initiated on interactive children (status menu, minimize, etc.).
      if (target.closest("button, input, textarea, [data-no-drag]")) return;
      const card = state.cards.find((c) => c.id === cardId);
      if (!card) return;
      dragRef.current = {
        cardId,
        startX: e.clientX,
        startY: e.clientY,
        origX: card.x,
        origY: card.y,
        moved: false,
      };
    },
    [state.cards, tool]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
      moveCard(d.cardId, d.origX + dx, d.origY + dy);
    };
    const onUp = () => {
      if (dragRef.current?.moved) justDraggedRef.current = true;
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [moveCard]);

  /* ---------- Card click (selection / connection wiring) ---------- */
  const onCardClick = useCallback(
    (cardId: string) => {
      if (justDraggedRef.current) {
        justDraggedRef.current = false;
        return;
      }
      if (tool === "connect") {
        if (pendingConnectionStart === null) {
          setPendingConnectionStart(cardId);
        } else if (pendingConnectionStart === cardId) {
          setPendingConnectionStart(null);
        } else {
          const newId = addConnection(pendingConnectionStart, cardId);
          setPendingConnectionStart(null);
          setRenamingConnectionId(newId);
        }
        return;
      }
      if (tool === "pointer") {
        setSelectedCardId(cardId);
      }
    },
    [addConnection, pendingConnectionStart, tool]
  );

  /* ---------- Canvas-level mousedown for grouping or deselect ---------- */
  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      // If user clicked a card, the card-level handler runs first.
      if (target.closest("[data-card-id]")) return;
      // Same for group / connection labels.
      if (target.closest("[data-group-id]") || target.closest("[data-conn-id]"))
        return;

      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left + canvasRef.current!.scrollLeft;
      const y = e.clientY - rect.top + canvasRef.current!.scrollTop;

      if (tool === "group") {
        setGroupDrag({ startX: x, startY: y, curX: x, curY: y });
      } else {
        setSelectedCardId(null);
        setPendingConnectionStart(null);
      }
    },
    [tool]
  );

  useEffect(() => {
    if (!groupDrag) return;
    const onMove = (e: PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left + canvasRef.current!.scrollLeft;
      const y = e.clientY - rect.top + canvasRef.current!.scrollTop;
      setGroupDrag((prev) => (prev ? { ...prev, curX: x, curY: y } : prev));
    };
    const onUp = () => {
      setGroupDrag((prev) => {
        if (!prev) return prev;
        const minX = Math.min(prev.startX, prev.curX);
        const minY = Math.min(prev.startY, prev.curY);
        const maxX = Math.max(prev.startX, prev.curX);
        const maxY = Math.max(prev.startY, prev.curY);
        if (maxX - minX < 30 || maxY - minY < 30) return null;

        const cardsInside = state.cards.filter((c) => {
          const cx = c.x + CARD_WIDTH / 2;
          const cy = c.y + cardHeight(c) / 2;
          return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
        });
        if (cardsInside.length === 0) return null;

        const padding = 20;
        const groupX = minX - padding;
        const groupY = minY - padding;
        const groupW = Math.max(maxX - minX + padding * 2, 220);
        const groupH = Math.max(maxY - minY + padding * 2, 180);
        const id = addGroup({
          label: "",
          x: groupX,
          y: groupY,
          width: groupW,
          height: groupH,
          cardIds: cardsInside.map((c) => c.id),
        });
        setRenamingGroupId(id);
        return null;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [groupDrag, state.cards, addGroup, cardHeight]);

  /* ---------- Group rectangle live preview ---------- */
  const groupPreview = groupDrag
    ? {
        left: Math.min(groupDrag.startX, groupDrag.curX),
        top: Math.min(groupDrag.startY, groupDrag.curY),
        width: Math.abs(groupDrag.curX - groupDrag.startX),
        height: Math.abs(groupDrag.curY - groupDrag.startY),
      }
    : null;

  /* ---------- Connection rendering ---------- */
  const connectionLines = useMemo(() => {
    return state.connections.map((conn) => {
      const a = state.cards.find((c) => c.id === conn.fromCardId);
      const b = state.cards.find((c) => c.id === conn.toCardId);
      if (!a || !b) return null;
      const ax = a.x + CARD_WIDTH / 2;
      const ay = a.y + cardHeight(a) / 2;
      const bx = b.x + CARD_WIDTH / 2;
      const by = b.y + cardHeight(b) / 2;
      const midX = (ax + bx) / 2;
      const midY = (ay + by) / 2;
      const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      return {
        id: conn.id,
        ax,
        ay,
        bx,
        by,
        midX,
        midY,
        angle,
        label: conn.label,
      };
    });
  }, [state.cards, state.connections, cardHeight]);

  /* ---------- Render ---------- */
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        background: "var(--color-parchment)",
        overflow: "hidden",
      }}
    >
      <Toolbar tool={tool} setTool={setTool} onReset={() => setConfirmReset(true)} />

      <div
        ref={canvasRef}
        onPointerDown={onCanvasPointerDown}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "auto",
          cursor:
            tool === "group" ? "crosshair" : tool === "connect" ? "default" : "default",
          backgroundImage:
            "radial-gradient(circle at center, rgba(39,37,30,0.18) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          backgroundPosition: "8px 8px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          }}
        >
          {/* Groups (rendered behind cards) */}
          {state.groups.map((g) => (
            <GroupBox
              key={g.id}
              x={g.x}
              y={g.y}
              w={g.width}
              h={g.height}
              label={g.label}
              renaming={renamingGroupId === g.id}
              onStartRename={() => setRenamingGroupId(g.id)}
              onRename={(v) => renameGroup(g.id, v)}
              onCommitRename={() => setRenamingGroupId(null)}
              onRemove={() => removeGroup(g.id)}
            />
          ))}

          {/* Connection lines */}
          <svg
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            {connectionLines.map((line) =>
              line ? (
                <line
                  key={line.id}
                  x1={line.ax}
                  y1={line.ay}
                  x2={line.bx}
                  y2={line.by}
                  stroke="var(--color-graphite)"
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                />
              ) : null
            )}
          </svg>

          {/* Connection labels (separate layer so they're clickable) */}
          {connectionLines.map((line) =>
            line ? (
              <ConnectionLabel
                key={line.id}
                connectionId={line.id}
                x={line.midX}
                y={line.midY}
                angle={line.angle}
                label={line.label}
                renaming={renamingConnectionId === line.id}
                onStartRename={() => setRenamingConnectionId(line.id)}
                onRename={(v) => renameConnection(line.id, v)}
                onCommitRename={() => setRenamingConnectionId(null)}
                onRemove={() => removeConnection(line.id)}
              />
            ) : null
          )}

          {/* Cards */}
          {state.cards.map((card) => {
            const hl = state.highlights.find((h) => h.id === card.highlightId);
            if (!hl) return null;
            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() =>
                  setHoveredCardId((c) => (c === card.id ? null : c))
                }
              >
                <AnnotationCardView
                  card={card}
                  highlight={hl}
                  selected={selectedCardId === card.id}
                  connecting={tool === "connect"}
                  pendingConnectionStart={pendingConnectionStart === card.id}
                  hovered={
                    hoveredCardId === card.id && tool === "connect"
                  }
                  toolMode={tool}
                  onPointerDown={(e) => onCardPointerDown(card.id, e)}
                  onCardClick={() => onCardClick(card.id)}
                  onSetStatus={(s) => setCardStatus(card.id, s)}
                  onToggleMinimize={() => toggleCardMinimized(card.id)}
                />
              </div>
            );
          })}

          {/* Live group preview */}
          {groupPreview && (
            <div
              style={{
                position: "absolute",
                left: groupPreview.left,
                top: groupPreview.top,
                width: groupPreview.width,
                height: groupPreview.height,
                background: "var(--color-accent-teal-soft)",
                border: "1px dashed var(--color-accent-teal-border)",
                pointerEvents: "none",
                borderRadius: 6,
              }}
            />
          )}
        </div>
      </div>

      {confirmReset && (
        <ResetCanvasModal
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetCanvas();
            setConfirmReset(false);
          }}
        />
      )}
    </div>
  );
}

function Toolbar({
  tool,
  setTool,
  onReset,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 10,
        display: "flex",
        gap: 4,
        padding: 4,
        background: "var(--color-paper-white)",
        border: "1px solid var(--color-hairline)",
        borderRadius: 10,
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <ToolButton
        active={tool === "pointer"}
        onClick={() => setTool("pointer")}
        icon="✛"
        label="Pointer"
      />
      <div style={{ width: 1, background: "var(--color-hairline)" }} />
      <ToolButton
        active={tool === "group"}
        onClick={() => setTool("group")}
        icon="▢"
        label="Grouping"
      />
      <div style={{ width: 1, background: "var(--color-hairline)" }} />
      <ToolButton
        active={tool === "connect"}
        onClick={() => setTool("connect")}
        icon="⇄"
        label="Connection"
      />
      <div style={{ width: 1, background: "var(--color-hairline)" }} />
      <ToolButton
        active={false}
        onClick={onReset}
        icon="↻"
        label="Reset"
      />
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        border: "none",
        background: active ? "var(--color-parchment)" : "transparent",
        color: active ? "var(--color-inkwell)" : "var(--color-dusk-gray)",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: "var(--text-body-sm)",
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function GroupBox({
  x,
  y,
  w,
  h,
  label,
  renaming,
  onStartRename,
  onRename,
  onCommitRename,
  onRemove,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  renaming: boolean;
  onStartRename: () => void;
  onRename: (label: string) => void;
  onCommitRename: () => void;
  onRemove: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  return (
    <div
      data-group-id
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: "rgba(39, 37, 30, 0.025)",
        border: "1px dashed var(--color-dusk-gray)",
        borderRadius: 12,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        {renaming ? (
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => onRename(e.target.value)}
            placeholder="Theme name"
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") onCommitRename();
            }}
            style={{
              background: "var(--color-paper-white)",
              border: "1px solid var(--color-accent-teal-border)",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: "var(--text-caption)",
              outline: "none",
              color: "var(--color-inkwell)",
              minWidth: 120,
            }}
          />
        ) : (
          <button
            type="button"
            onClick={onStartRename}
            style={{
              background: "var(--color-accent-teal-soft)",
              border: "1px solid var(--color-accent-teal-border)",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: "var(--text-caption)",
              cursor: "pointer",
              color: "var(--color-graphite)",
            }}
          >
            {label || (
              <span style={{ color: "var(--color-faded-stone)" }}>
                + Name theme
              </span>
            )}
          </button>
        )}
        {showActions && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove group"
            style={{
              background: "var(--color-paper-white)",
              border: "1px solid var(--color-hairline)",
              borderRadius: 6,
              padding: "2px 6px",
              fontSize: 10,
              color: "var(--color-faded-stone)",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function ConnectionLabel({
  x,
  y,
  angle,
  label,
  renaming,
  onStartRename,
  onRename,
  onCommitRename,
  onRemove,
}: {
  connectionId: string;
  x: number;
  y: number;
  angle: number;
  label: string;
  renaming: boolean;
  onStartRename: () => void;
  onRename: (label: string) => void;
  onCommitRename: () => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  // Normalize the angle so text isn't upside-down.
  const adjusted = angle > 90 || angle < -90 ? angle + 180 : angle;

  return (
    <div
      data-conn-id
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${adjusted}deg)`,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {renaming ? (
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Connection"
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") onCommitRename();
          }}
          style={{
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: "var(--text-caption)",
            outline: "none",
            color: "var(--color-inkwell)",
            minWidth: 100,
          }}
        />
      ) : label ? (
        <button
          type="button"
          onClick={onStartRename}
          style={{
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: "var(--text-caption)",
            color: "var(--color-graphite)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={onStartRename}
          style={{
            background: hovered ? "var(--color-paper-white)" : "transparent",
            border: hovered ? "1px solid var(--color-hairline)" : "1px solid transparent",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: "var(--text-caption)",
            color: hovered ? "var(--color-faded-stone)" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all var(--transition-fast)",
          }}
        >
          + label
        </button>
      )}
      {hovered && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove connection"
          style={{
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 6,
            padding: "2px 6px",
            fontSize: 10,
            color: "var(--color-faded-stone)",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function ResetCanvasModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(39, 37, 30, 0.32)",
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
          maxWidth: 400,
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: "var(--weight-medium)",
            marginBottom: 8,
          }}
        >
          Reset the canvas?
        </div>
        <p
          style={{
            color: "var(--color-dusk-gray)",
            fontSize: "var(--text-body-sm)",
            marginTop: 0,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Cards return to their default grid positions. All groups and
          connections are removed. Your highlights and notes are kept.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: "var(--color-graphite)",
              color: "var(--color-paper-white)",
              border: "1px solid var(--color-graphite)",
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              fontSize: "var(--text-body-sm)",
            }}
          >
            Reset canvas
          </button>
        </div>
      </div>
    </div>
  );
}
