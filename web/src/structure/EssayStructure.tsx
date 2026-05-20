import { useEffect, useRef, useState } from "react";
import { useSession } from "../state/SessionProvider";
import type {
  AnnotationCard,
  EssayBlock,
  EssayBlockType,
  EssaySection,
} from "../state/types";
import type { PassageHighlight } from "../closeReading/highlightTypes";
import { critiqueStructure } from "../lib/ai";

type DragPayload = {
  fromSectionId: string;
  blockId: string;
};

const BLOCK_LABELS: Record<EssayBlockType, string> = {
  text: "Text",
  "topic-sentence": "Topic Sentence",
  "thesis-statement": "Thesis Statement",
  "annotation-card": "Annotation Card",
};

export function EssayStructure() {
  const {
    state,
    addSection,
    removeSection,
    renameSection,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    setStructureFeedback,
  } = useSession();

  const [feedbackLoading, setFeedbackLoading] = useState(false);

  /* Drag and drop wiring (HTML5 drag API for cross-section reordering). */
  const dragPayloadRef = useRef<DragPayload | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    sectionId: string;
    index: number;
  } | null>(null);

  const onDragStart = (payload: DragPayload) => {
    dragPayloadRef.current = payload;
  };
  const onDragEnd = () => {
    dragPayloadRef.current = null;
    setDropIndicator(null);
  };
  const onDropAt = (toSectionId: string, toIndex: number) => {
    const p = dragPayloadRef.current;
    dragPayloadRef.current = null;
    setDropIndicator(null);
    if (!p) return;
    if (p.fromSectionId === toSectionId) {
      const sec = state.essaySections.find((s) => s.id === toSectionId);
      if (!sec) return;
      const oldIndex = sec.blocks.findIndex((b) => b.id === p.blockId);
      if (oldIndex < toIndex) toIndex--;
    }
    moveBlock({
      fromSectionId: p.fromSectionId,
      blockId: p.blockId,
      toSectionId,
      toIndex,
    });
  };

  const onRequestStructureFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const paragraphs = state.essaySections.map((sec) => ({
        label: sec.label,
        preview: sec.blocks
          .map((b) => {
            if (b.type === "annotation-card") {
              const card = state.cards.find((c) => c.id === b.cardId);
              const hl = state.highlights.find(
                (h) => h.id === card?.highlightId
              );
              return hl ? `[Quote: ${hl.quote}]` : "[Card]";
            }
            if (b.type === "thesis-statement") return `[Thesis: ${state.thesis}]`;
            return b.content ?? "";
          })
          .join("\n"),
      }));
      const out = await critiqueStructure({
        thesis: state.thesis,
        paragraphs,
      });
      setStructureFeedback(out);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--color-paper-white)",
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "var(--text-caption)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--color-faded-stone)",
                marginBottom: 6,
              }}
            >
              Essay structure
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: "var(--weight-medium)",
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              Arrange your evidence into an argument.
            </h1>
          </div>
          <button
            type="button"
            onClick={onRequestStructureFeedback}
            disabled={feedbackLoading}
            style={{
              background: "var(--color-paper-white)",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-pill)",
              padding: "6px 14px",
              fontSize: "var(--text-body-sm)",
              cursor: feedbackLoading ? "not-allowed" : "pointer",
              color: "var(--color-graphite)",
            }}
          >
            {feedbackLoading ? "Thinking…" : "Critique structure"}
          </button>
        </div>

        {state.structureFeedback && (
          <div
            style={{
              border: "1px solid var(--color-hairline)",
              borderRadius: 16,
              padding: 16,
              background: "var(--color-parchment)",
              fontSize: "var(--text-body-sm)",
              color: "var(--color-graphite)",
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--color-faded-stone)",
                marginBottom: 6,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Structure feedback
            </div>
            {state.structureFeedback}
          </div>
        )}

        {state.essaySections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            cards={state.cards}
            highlights={state.highlights}
            thesis={state.thesis}
            canDelete={state.essaySections.length > 1}
            onRename={(label) => renameSection(section.id, label)}
            onRemove={() => removeSection(section.id)}
            onAddBlock={(type, options) => addBlock(section.id, type, options)}
            onUpdateBlock={(blockId, patch) =>
              updateBlock(section.id, blockId, patch)
            }
            onRemoveBlock={(blockId) => removeBlock(section.id, blockId)}
            onBlockDragStart={(blockId) =>
              onDragStart({ fromSectionId: section.id, blockId })
            }
            onBlockDragEnd={onDragEnd}
            dropIndicator={
              dropIndicator?.sectionId === section.id ? dropIndicator.index : null
            }
            onDropHover={(index) => setDropIndicator({ sectionId: section.id, index })}
            onDropAt={(index) => onDropAt(section.id, index)}
          />
        ))}

        <button
          type="button"
          onClick={addSection}
          style={{
            border: "1px dashed var(--color-hairline)",
            background: "transparent",
            borderRadius: 16,
            padding: "14px 16px",
            color: "var(--color-dusk-gray)",
            cursor: "pointer",
            fontSize: "var(--text-body-sm)",
          }}
        >
          + Add body paragraph
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  cards,
  highlights,
  thesis,
  canDelete,
  onRename,
  onRemove,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onBlockDragStart,
  onBlockDragEnd,
  dropIndicator,
  onDropHover,
  onDropAt,
}: {
  section: EssaySection;
  cards: AnnotationCard[];
  highlights: PassageHighlight[];
  thesis: string;
  canDelete: boolean;
  onRename: (label: string) => void;
  onRemove: () => void;
  onAddBlock: (
    type: EssayBlockType,
    options?: { content?: string; cardId?: string }
  ) => void;
  onUpdateBlock: (blockId: string, patch: Partial<EssayBlock>) => void;
  onRemoveBlock: (blockId: string) => void;
  onBlockDragStart: (blockId: string) => void;
  onBlockDragEnd: () => void;
  dropIndicator: number | null;
  onDropHover: (index: number) => void;
  onDropAt: (index: number) => void;
}) {
  return (
    <div
      style={{
        background: "var(--color-parchment)",
        border: "1px solid var(--color-hairline)",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <SectionLabelInput value={section.label} onChange={onRename} />
        {canDelete && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove section"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-faded-stone)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ×
          </button>
        )}
      </div>

      <BlockList
        section={section}
        cards={cards}
        highlights={highlights}
        thesis={thesis}
        onUpdateBlock={onUpdateBlock}
        onRemoveBlock={onRemoveBlock}
        onBlockDragStart={onBlockDragStart}
        onBlockDragEnd={onBlockDragEnd}
        dropIndicator={dropIndicator}
        onDropHover={onDropHover}
        onDropAt={onDropAt}
      />

      <AddBlockBar
        cards={cards}
        highlights={highlights}
        thesisAvailable={Boolean(thesis.trim())}
        onAdd={(type, options) => onAddBlock(type, options)}
      />
    </div>
  );
}

function SectionLabelInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "transparent",
        border: "none",
        outline: "none",
        fontSize: "var(--text-caption)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-dusk-gray)",
        padding: "2px 0",
        fontFamily: "inherit",
      }}
    />
  );
}

function BlockList({
  section,
  cards,
  highlights,
  thesis,
  onUpdateBlock,
  onRemoveBlock,
  onBlockDragStart,
  onBlockDragEnd,
  dropIndicator,
  onDropHover,
  onDropAt,
}: {
  section: EssaySection;
  cards: AnnotationCard[];
  highlights: PassageHighlight[];
  thesis: string;
  onUpdateBlock: (blockId: string, patch: Partial<EssayBlock>) => void;
  onRemoveBlock: (blockId: string) => void;
  onBlockDragStart: (blockId: string) => void;
  onBlockDragEnd: () => void;
  dropIndicator: number | null;
  onDropHover: (index: number) => void;
  onDropAt: (index: number) => void;
}) {
  if (section.blocks.length === 0) {
    return (
      <DropZone
        index={0}
        active={dropIndicator === 0}
        onHover={onDropHover}
        onDrop={onDropAt}
      >
        <span
          style={{
            color: "var(--color-faded-stone)",
            fontSize: "var(--text-body-sm)",
            fontStyle: "italic",
          }}
        >
          Empty. Use the bar below to add a block.
        </span>
      </DropZone>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {section.blocks.map((block, i) => (
        <div key={block.id}>
          <DropZone
            index={i}
            active={dropIndicator === i}
            onHover={onDropHover}
            onDrop={onDropAt}
          />
          <BlockView
            block={block}
            cards={cards}
            highlights={highlights}
            thesis={thesis}
            onUpdate={(patch) => onUpdateBlock(block.id, patch)}
            onRemove={() => onRemoveBlock(block.id)}
            onDragStart={() => onBlockDragStart(block.id)}
            onDragEnd={onBlockDragEnd}
          />
        </div>
      ))}
      <DropZone
        index={section.blocks.length}
        active={dropIndicator === section.blocks.length}
        onHover={onDropHover}
        onDrop={onDropAt}
      />
    </div>
  );
}

function DropZone({
  index,
  active,
  onHover,
  onDrop,
  children,
}: {
  index: number;
  active: boolean;
  onHover: (i: number) => void;
  onDrop: (i: number) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onHover(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
      style={{
        minHeight: children ? 56 : 8,
        margin: "2px 0",
        borderRadius: 8,
        background: active
          ? "var(--color-accent-teal-soft)"
          : "transparent",
        border: active
          ? "1px dashed var(--color-accent-teal-border)"
          : "1px dashed transparent",
        display: "flex",
        alignItems: "center",
        padding: children ? 12 : 0,
        transition: "background var(--transition-fast)",
      }}
    >
      {children}
    </div>
  );
}

function BlockView({
  block,
  cards,
  highlights,
  thesis,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnd,
}: {
  block: EssayBlock;
  cards: AnnotationCard[];
  highlights: PassageHighlight[];
  thesis: string;
  onUpdate: (patch: Partial<EssayBlock>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        // We don't actually use dataTransfer (we route via a ref), but Firefox
        // requires setData for the drag to start.
        e.dataTransfer.setData("text/plain", block.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "6px 0",
      }}
    >
      <span
        style={{
          width: 18,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-faded-stone)",
          fontSize: 14,
          cursor: "grab",
          flexShrink: 0,
          opacity: hovered ? 1 : 0.3,
          transition: "opacity var(--transition-fast)",
        }}
        aria-label="Drag handle"
      >
        ⋮⋮
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {block.type === "text" ? (
          <PlainTextBlock
            value={block.content ?? ""}
            onChange={(v) => onUpdate({ content: v })}
          />
        ) : block.type === "topic-sentence" ? (
          <LabeledBlock
            label="Topic Sentence"
            renderBody={
              <PlainTextBlock
                value={block.content ?? ""}
                onChange={(v) => onUpdate({ content: v })}
                multiline
              />
            }
          />
        ) : block.type === "thesis-statement" ? (
          <LabeledBlock
            label="Thesis Statement"
            renderBody={
              thesis.trim() ? (
                <div
                  style={{
                    fontSize: "var(--text-body)",
                    color: "var(--color-inkwell)",
                    lineHeight: 1.55,
                  }}
                >
                  {thesis}
                </div>
              ) : (
                <span
                  style={{
                    color: "var(--color-faded-stone)",
                    fontStyle: "italic",
                  }}
                >
                  No thesis yet — head to the Thesis Formation tab.
                </span>
              )
            }
          />
        ) : block.type === "annotation-card" ? (
          (() => {
            const card = cards.find((c) => c.id === block.cardId);
            const hl = highlights.find((h) => h.id === card?.highlightId);
            return (
              <LabeledBlock
                label="Annotation Card"
                renderBody={
                  hl ? (
                    <div>
                      <div
                        style={{
                          fontSize: "var(--text-body-sm)",
                          color: "var(--color-dusk-gray)",
                          fontStyle: "italic",
                          marginBottom: 6,
                          lineHeight: 1.5,
                        }}
                      >
                        “{hl.quote}”
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-body-sm)",
                          color: "var(--color-graphite)",
                          lineHeight: 1.5,
                        }}
                      >
                        {hl.note || (
                          <span style={{ color: "var(--color-faded-stone)" }}>
                            (no annotation)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--color-faded-stone)" }}>
                      Missing card
                    </span>
                  )
                }
              />
            );
          })()
        ) : null}
      </div>

      {hovered && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove block"
          style={{
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 6,
            padding: "2px 6px",
            cursor: "pointer",
            color: "var(--color-faded-stone)",
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function PlainTextBlock({
  value,
  onChange,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Auto-grow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={multiline ? "Write your topic sentence…" : "Write here…"}
      rows={1}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        outline: "none",
        resize: "none",
        fontFamily: "inherit",
        fontSize: "var(--text-body)",
        lineHeight: 1.55,
        color: "var(--color-inkwell)",
        padding: 0,
        overflow: "hidden",
      }}
    />
  );
}

function LabeledBlock({
  label,
  renderBody,
}: {
  label: string;
  renderBody: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--color-paper-white)",
        border: "1px solid var(--color-hairline)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: "var(--text-caption)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-faded-stone)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {renderBody}
    </div>
  );
}

function AddBlockBar({
  cards,
  highlights,
  thesisAvailable,
  onAdd,
}: {
  cards: AnnotationCard[];
  highlights: PassageHighlight[];
  thesisAvailable: boolean;
  onAdd: (
    type: EssayBlockType,
    options?: { content?: string; cardId?: string }
  ) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [menuOpen]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingTop: 4,
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={() => setMenuOpen((m) => !m)}
        aria-label="Add block"
        style={{
          background: "var(--color-paper-white)",
          border: "1px solid var(--color-hairline)",
          width: 22,
          height: 22,
          borderRadius: 6,
          fontSize: 14,
          color: "var(--color-dusk-gray)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        +
      </button>
      <button
        type="button"
        onClick={() => onAdd("text")}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          color: "var(--color-faded-stone)",
          fontSize: "var(--text-body-sm)",
          cursor: "text",
        }}
      >
        Add text…
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: 28,
            left: 0,
            minWidth: 260,
            maxHeight: 320,
            overflowY: "auto",
            background: "var(--color-paper-white)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 12,
            boxShadow: "var(--shadow-card)",
            padding: 4,
            zIndex: 50,
          }}
        >
          <MenuLabel>Basic</MenuLabel>
          <MenuItem
            label={BLOCK_LABELS.text}
            description="Plain paragraph or note"
            onClick={() => {
              onAdd("text");
              setMenuOpen(false);
            }}
          />
          <MenuItem
            label={BLOCK_LABELS["topic-sentence"]}
            description="Lead this paragraph's argument"
            onClick={() => {
              onAdd("topic-sentence");
              setMenuOpen(false);
            }}
          />
          <MenuLabel>Pull in</MenuLabel>
          <MenuItem
            label={BLOCK_LABELS["thesis-statement"]}
            description={
              thesisAvailable
                ? "Insert your saved thesis"
                : "No thesis yet"
            }
            disabled={!thesisAvailable}
            onClick={() => {
              if (!thesisAvailable) return;
              onAdd("thesis-statement");
              setMenuOpen(false);
            }}
          />
          <MenuLabel>Annotation cards</MenuLabel>
          {cards.length === 0 ? (
            <div
              style={{
                padding: "8px 10px",
                fontSize: "var(--text-body-sm)",
                color: "var(--color-faded-stone)",
              }}
            >
              No annotation cards yet. Highlight passages in Close Reading.
            </div>
          ) : (
            cards.map((c) => {
              const hl = highlights.find((h) => h.id === c.highlightId);
              if (!hl) return null;
              const preview =
                hl.quote.length > 60 ? `${hl.quote.slice(0, 60)}…` : hl.quote;
              return (
                <MenuItem
                  key={c.id}
                  label={hl.sectionLabel ?? "Quote"}
                  description={`"${preview}"`}
                  onClick={() => {
                    onAdd("annotation-card", { cardId: c.id });
                    setMenuOpen(false);
                  }}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "var(--text-caption)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-faded-stone)",
        padding: "6px 10px 2px",
      }}
    >
      {children}
    </div>
  );
}

function MenuItem({
  label,
  description,
  onClick,
  disabled,
}: {
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        background: "transparent",
        border: "1px solid transparent",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "var(--color-faded-stone)" : "var(--color-inkwell)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--color-parchment)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: "var(--text-body-sm)", fontWeight: "var(--weight-medium)" }}>
        {label}
      </span>
      {description && (
        <span
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--color-faded-stone)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {description}
        </span>
      )}
    </button>
  );
}
