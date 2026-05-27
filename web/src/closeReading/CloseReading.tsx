import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HighlightableBlock } from "./HighlightableBlock";
import StoryTimeline from "./StoryTimeline";
import { STORY_RUNS } from "./storyRuns";
import { flattenRuns, getTextOffsetInBlock } from "./highlightText";
import type { StoryEvent } from "./timeline.types";
import {
  NewHighlightToolbar,
  type DraftState,
} from "./SelectionToolbar";
import { HIGHLIGHT_PALETTE, type PassageHighlight } from "./highlightTypes";
import { useSession } from "../state/SessionProvider";
import { uid } from "../lib/id";

const EVENTS: StoryEvent[] = [
  {
    id: "e1",
    label: "The Red Death Ravages the Land",
    anchor: "e1-anchor",
    subEvents: [
      {
        id: "e1a",
        label: "Pestilence described",
        anchor: "e1a-anchor",
        subEvents: [
          { id: "e1a1", label: "Fatal and hideous", anchor: "e1a1-anchor" },
          { id: "e1a2", label: "Symptoms and seal", anchor: "e1a2-anchor" },
        ],
      },
      {
        id: "e1b",
        label: "Half the kingdom perishes",
        anchor: "e1b-anchor",
        subEvents: [
          { id: "e1b1", label: "Scarlet horror", anchor: "e1b1-anchor" },
          { id: "e1b2", label: "Half an hour", anchor: "e1b2-anchor" },
        ],
      },
    ],
  },
  {
    id: "e2",
    label: "Prince Prospero's Retreat",
    anchor: "e2-anchor",
    subEvents: [
      {
        id: "e2a",
        label: "Thousand knights summoned",
        anchor: "e2a-anchor",
        subEvents: [
          { id: "e2a1", label: "Bold and sagacious", anchor: "e2a1-anchor" },
          { id: "e2a2", label: "Welded bolts", anchor: "e2a2-anchor" },
        ],
      },
      {
        id: "e2b",
        label: "The abbey sealed shut",
        anchor: "e2b-anchor",
        subEvents: [
          { id: "e2b1", label: "Welded gates", anchor: "e2b1-anchor" },
          { id: "e2b2", label: "Within and without", anchor: "e2b2-anchor" },
        ],
      },
    ],
  },
  {
    id: "e3",
    label: "The Seven Rooms",
    anchor: "e3-anchor",
    subEvents: [
      {
        id: "e3a",
        label: "Irregular suite described",
        anchor: "e3a-anchor",
        subEvents: [
          { id: "e3a1", label: "Seven chambers", anchor: "e3a1-anchor" },
          { id: "e3a2", label: "A new scene at each turn", anchor: "e3a2-anchor" },
        ],
      },
      {
        id: "e3b",
        label: "Each room's color and light",
        anchor: "e3b-anchor",
        subEvents: [
          { id: "e3b1", label: "Six hues east to west", anchor: "e3b1-anchor" },
          { id: "e3b2", label: "Braziers and stained light", anchor: "e3b2-anchor" },
        ],
      },
      {
        id: "e3c",
        label: "Black room and ebony clock",
        anchor: "e3c-anchor",
        subEvents: [
          { id: "e3c1", label: "Black velvet, scarlet panes", anchor: "e3c1-anchor" },
          { id: "e3c2", label: "The brazen hour", anchor: "e3c2-anchor" },
        ],
      },
    ],
  },
  {
    id: "e4",
    label: "The Masquerade Ball",
    anchor: "e4-anchor",
    subEvents: [
      {
        id: "e4a",
        label: "Grotesque costumes",
        anchor: "e4a-anchor",
        subEvents: [
          { id: "e4a1", label: "Wild and magnificent", anchor: "e4a1-anchor" },
          { id: "e4a2", label: "Dreams, not reason", anchor: "e4a2-anchor" },
        ],
      },
      {
        id: "e4b",
        label: "The clock strikes — all pause",
        anchor: "e4b-anchor",
        subEvents: [
          { id: "e4b1", label: "Laughter ceases", anchor: "e4b1-anchor" },
          { id: "e4b2", label: "The western chamber", anchor: "e4b2-anchor" },
        ],
      },
    ],
  },
  {
    id: "e5",
    label: "The Stranger Appears",
    anchor: "e5-anchor",
    subEvents: [
      {
        id: "e5a",
        label: "A figure unlike the others",
        anchor: "e5a-anchor",
        subEvents: [
          { id: "e5a1", label: "After the twelfth chime", anchor: "e5a1-anchor" },
          { id: "e5a2", label: "Terror and disgust", anchor: "e5a2-anchor" },
        ],
      },
      {
        id: "e5b",
        label: "Costume of the Red Death",
        anchor: "e5b-anchor",
        subEvents: [
          { id: "e5b1", label: "Blood-spotted garments", anchor: "e5b1-anchor" },
          { id: "e5b2", label: "Corpse-like mask", anchor: "e5b2-anchor" },
        ],
      },
      {
        id: "e5c",
        label: "Prospero's fury",
        anchor: "e5c-anchor",
        subEvents: [
          { id: "e5c1", label: "Ordered seized", anchor: "e5c1-anchor" },
          { id: "e5c2", label: "Dagger drawn", anchor: "e5c2-anchor" },
        ],
      },
    ],
  },
  {
    id: "e6",
    label: "The Chase",
    anchor: "e6-anchor",
    subEvents: [
      {
        id: "e6a",
        label: "Prospero pursues alone",
        anchor: "e6a-anchor",
        subEvents: [
          { id: "e6a1", label: "Through six colors", anchor: "e6a1-anchor" },
          { id: "e6a2", label: "Never overtaken", anchor: "e6a2-anchor" },
        ],
      },
      {
        id: "e6b",
        label: "Into the black room",
        anchor: "e6b-anchor",
        subEvents: [
          { id: "e6b1", label: "The red gloom", anchor: "e6b1-anchor" },
          { id: "e6b2", label: "Dead on the sable carpet", anchor: "e6b2-anchor" },
        ],
      },
    ],
  },
  {
    id: "e7",
    label: "Death Comes for All",
    anchor: "e7-anchor",
    subEvents: [
      {
        id: "e7a",
        label: "Prospero falls",
        anchor: "e7a-anchor",
        subEvents: [
          { id: "e7a1", label: "Seizing the figure", anchor: "e7a1-anchor" },
          { id: "e7a2", label: "No tangible form", anchor: "e7a2-anchor" },
        ],
      },
      {
        id: "e7b",
        label: "Revelers unmask the stranger",
        anchor: "e7b-anchor",
        subEvents: [
          { id: "e7b1", label: "Red Death within", anchor: "e7b1-anchor" },
          { id: "e7b2", label: "One by one", anchor: "e7b2-anchor" },
        ],
      },
      {
        id: "e7c",
        label: "Darkness and decay",
        anchor: "e7c-anchor",
        subEvents: [
          { id: "e7c1", label: "Clock and tripods out", anchor: "e7c1-anchor" },
          { id: "e7c2", label: "Illimitable dominion", anchor: "e7c2-anchor" },
        ],
      },
    ],
  },
];

/** Block id → section label, used when we create a new highlight. */
const SECTION_LABEL_BY_BLOCK: Record<string, string> = {};
for (const e of EVENTS) {
  for (const sub of e.subEvents) {
    SECTION_LABEL_BY_BLOCK[sub.id] = e.label;
    for (const ss of sub.subEvents ?? []) {
      SECTION_LABEL_BY_BLOCK[ss.id] = e.label;
    }
  }
}
SECTION_LABEL_BY_BLOCK["e3-intro"] = "The Seven Rooms";
SECTION_LABEL_BY_BLOCK["e6-intro"] = "The Chase";

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 18px",
  fontSize: 18,
  lineHeight: 1.72,
  color: "var(--color-inkwell)",
};

const headingStyle: React.CSSProperties = {
  margin: "32px 0 14px",
  fontSize: 26,
  fontWeight: 500,
  lineHeight: 1.15,
  color: "var(--color-graphite)",
  letterSpacing: "-0.005em",
};

const DOC_TOP_PADDING = 72;
const DOC_HORIZONTAL_PADDING = 80;
const DOC_WIDTH = 840;
const ANNOTATION_GUTTER_WIDTH = 260;
const ANNOTATION_CARD_VIEW_HEIGHT = 112;
const ANNOTATION_CARD_EDIT_HEIGHT = 198;
const ANNOTATION_CARD_GAP = 14;

export function CloseReading() {
  const { state, addHighlight, updateHighlight, removeHighlight } = useSession();
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [cardTops, setCardTops] = useState<Record<string, number>>({});
  const articleRef = useRef<HTMLElement | null>(null);
  const documentRef = useRef<HTMLDivElement | null>(null);

  const highlightedNotes = useMemo(
    () => state.highlights.filter((h) => h.note.trim().length > 0),
    [state.highlights]
  );

  const measureAnnotationPositions = useCallback(() => {
    const article = articleRef.current;
    if (!article) return;
    const articleTop = article.getBoundingClientRect().top;
    const next: Record<string, number> = {};
    for (const highlight of highlightedNotes) {
      const mark = article.querySelector<HTMLElement>(
        `[data-highlight-id="${highlight.id}"]`
      );
      if (!mark) continue;
      const markTop = mark.getBoundingClientRect().top - articleTop;
      next[highlight.id] = Math.max(0, DOC_TOP_PADDING + markTop - 8);
    }
    setCardTops(next);
  }, [highlightedNotes]);

  useLayoutEffect(() => {
    measureAnnotationPositions();
  }, [measureAnnotationPositions]);

  useEffect(() => {
    window.addEventListener("resize", measureAnnotationPositions);
    return () => window.removeEventListener("resize", measureAnnotationPositions);
  }, [measureAnnotationPositions]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-annotation-card]")) return;
      if (target.closest("[data-highlight-id]")) return;
      setEditingHighlightId(null);
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, []);

  /* Listen for selections inside the article. */
  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      if (!articleRef.current || !articleRef.current.contains(range.commonAncestorContainer)) {
        return;
      }
      const commonEl =
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
          ? range.commonAncestorContainer.parentElement
          : (range.commonAncestorContainer as Element);
      if (commonEl?.closest("[data-highlight-id]")) {
        return;
      }
      const startEl =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as Element);
      const endEl =
        range.endContainer.nodeType === Node.TEXT_NODE
          ? range.endContainer.parentElement
          : (range.endContainer as Element);
      const blockStart = startEl?.closest("[data-highlight-block]") as HTMLElement | null;
      const blockEnd = endEl?.closest("[data-highlight-block]") as HTMLElement | null;
      if (!blockStart || blockStart !== blockEnd) {
        setDraft(null);
        return;
      }
      const so = getTextOffsetInBlock(
        blockStart,
        range.startContainer,
        range.startOffset
      );
      const eo = getTextOffsetInBlock(
        blockStart,
        range.endContainer,
        range.endOffset
      );
      if (so == null || eo == null || so === eo) {
        setDraft(null);
        return;
      }
      const start = Math.min(so, eo);
      const end = Math.max(so, eo);
      const blockId = blockStart.dataset.highlightBlock!;
      const text = flattenRuns(STORY_RUNS[blockId] ?? []);
      const quote = text.slice(start, end);
      if (!quote.trim()) {
        setDraft(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setDraft({
        blockId,
        start,
        end,
        quote,
        sectionLabel: SECTION_LABEL_BY_BLOCK[blockId],
        left: rect.left + rect.width / 2,
        top: rect.bottom + 8,
      });
    };

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  /* Click on existing highlight → focus its right-margin annotation card. */
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest("[data-highlight-id]");
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      const id = t.getAttribute("data-highlight-id");
      if (!id) return;
      setDraft(null);
      window.getSelection()?.removeAllRanges();
      setEditingHighlightId(id);
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

  const onSaveNew = useCallback(
    (color: string, note: string) => {
      if (!draft) return;
      addHighlight({
        id: uid("hl"),
        blockId: draft.blockId,
        start: draft.start,
        end: draft.end,
        quote: draft.quote,
        sectionLabel: draft.sectionLabel,
        color,
        note: note.trim(),
        createdAt: Date.now(),
      });
      setEditingHighlightId(null);
      setDraft(null);
      window.getSelection()?.removeAllRanges();
    },
    [addHighlight, draft]
  );

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        background: "#f1f1ef",
        overflowY: "auto",
      }}
    >
      <StoryTimeline events={EVENTS} />

      <main
        style={{
          marginLeft: 220,
          padding: "48px 56px 96px",
          fontFamily: "Georgia, 'Source Serif Pro', serif",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          minWidth: DOC_WIDTH + ANNOTATION_GUTTER_WIDTH + 96,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            position: "relative",
          }}
        >
          <div
            ref={documentRef}
            style={{
              width: DOC_WIDTH,
              minHeight: 1080,
              background: "var(--color-paper-white)",
              border: "1px solid #dedbd5",
              boxShadow: "0 1px 2px rgba(39, 37, 30, 0.04)",
              padding: `${DOC_TOP_PADDING}px ${DOC_HORIZONTAL_PADDING}px 96px`,
            }}
          >
            <article ref={articleRef as React.RefObject<HTMLElement>}>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 500,
                  margin: "0 0 12px",
                  letterSpacing: "-0.01em",
                }}
              >
                The Masque of the Red Death
              </h1>
              <HighlightableBlock
                blockId="meta-source"
                anchorId="meta-source-anchor"
                paragraphStyle={{
                  ...paragraphStyle,
                  fontSize: 14,
                  color: "var(--color-dusk-gray)",
                  marginTop: -4,
                  marginBottom: 32,
                  fontFamily: "var(--font-sans)",
                }}
                runs={STORY_RUNS["meta-source"]}
                highlights={state.highlights}
              />

              <Section id="e1-anchor" title="The Red Death Ravages the Land">
              <Block id="e1a-anchor">
                <P blockId="e1a1" highlights={state.highlights} />
                <P blockId="e1a2" highlights={state.highlights} />
              </Block>
              <Block id="e1b-anchor">
                <P blockId="e1b1" highlights={state.highlights} />
                <P blockId="e1b2" highlights={state.highlights} />
              </Block>
            </Section>

            <Section id="e2-anchor" title="Prince Prospero's Retreat">
              <Block id="e2a-anchor">
                <P blockId="e2a1" highlights={state.highlights} />
                <P blockId="e2a2" highlights={state.highlights} />
              </Block>
              <Block id="e2b-anchor">
                <P blockId="e2b1" highlights={state.highlights} />
                <P blockId="e2b2" highlights={state.highlights} />
              </Block>
            </Section>

            <Section id="e3-anchor" title="The Seven Rooms">
              <P blockId="e3-intro" highlights={state.highlights} />
              <Block id="e3a-anchor">
                <P blockId="e3a1" highlights={state.highlights} />
                <P blockId="e3a2" highlights={state.highlights} />
              </Block>
              <Block id="e3b-anchor">
                <P blockId="e3b1" highlights={state.highlights} />
                <P blockId="e3b2" highlights={state.highlights} />
              </Block>
              <Block id="e3c-anchor">
                <P blockId="e3c1" highlights={state.highlights} />
                <P blockId="e3c2" highlights={state.highlights} />
              </Block>
            </Section>

            <Section id="e4-anchor" title="The Masquerade Ball">
              <Block id="e4a-anchor">
                <P blockId="e4a1" highlights={state.highlights} />
                <P blockId="e4a2" highlights={state.highlights} />
              </Block>
              <Block id="e4b-anchor">
                <P blockId="e4b1" highlights={state.highlights} />
                <P blockId="e4b2" highlights={state.highlights} />
              </Block>
            </Section>

            <Section id="e5-anchor" title="The Stranger Appears">
              <Block id="e5a-anchor">
                <P blockId="e5a1" highlights={state.highlights} />
                <P blockId="e5a2" highlights={state.highlights} />
              </Block>
              <Block id="e5b-anchor">
                <P blockId="e5b1" highlights={state.highlights} />
                <P blockId="e5b2" highlights={state.highlights} />
              </Block>
              <Block id="e5c-anchor">
                <P blockId="e5c1" highlights={state.highlights} />
                <P blockId="e5c2" highlights={state.highlights} />
              </Block>
            </Section>

            <Section id="e6-anchor" title="The Chase Through the Rooms">
              <P blockId="e6-intro" highlights={state.highlights} />
              <Block id="e6a-anchor">
                <P blockId="e6a1" highlights={state.highlights} />
                <P blockId="e6a2" highlights={state.highlights} />
              </Block>
              <Block id="e6b-anchor">
                <P blockId="e6b1" highlights={state.highlights} />
                <P blockId="e6b2" highlights={state.highlights} />
              </Block>
            </Section>

            <Section id="e7-anchor" title="Death Comes for All" lastSection>
              <Block id="e7a-anchor">
                <p style={paragraphStyle}>
                  <HighlightableBlock
                    wrapper="inline"
                    blockId="e7a1"
                    anchorId="e7a1-anchor"
                    runs={STORY_RUNS.e7a1}
                    highlights={state.highlights}
                  />{" "}
                  <HighlightableBlock
                    wrapper="inline"
                    blockId="e7a2"
                    anchorId="e7a2-anchor"
                    runs={STORY_RUNS.e7a2}
                    highlights={state.highlights}
                  />
                </p>
              </Block>
              <Block id="e7b-anchor">
                <P blockId="e7b1" highlights={state.highlights} />
                <P blockId="e7b2" highlights={state.highlights} />
              </Block>
              <Block id="e7c-anchor">
                <P blockId="e7c1" highlights={state.highlights} />
                <P blockId="e7c2" highlights={state.highlights} />
              </Block>
            </Section>
            </article>
          </div>

          <AnnotationGutter
            highlights={highlightedNotes}
            cardTops={cardTops}
            editingHighlightId={editingHighlightId}
            onEdit={setEditingHighlightId}
            onSave={(id, note, color) => {
              updateHighlight(id, { note: note.trim(), color });
              setEditingHighlightId(null);
              requestAnimationFrame(measureAnnotationPositions);
            }}
            onColorChange={(id, color) => {
              updateHighlight(id, { color });
              requestAnimationFrame(measureAnnotationPositions);
            }}
            onDelete={(id) => {
              removeHighlight(id);
              setEditingHighlightId((current) => (current === id ? null : current));
              requestAnimationFrame(measureAnnotationPositions);
            }}
          />
        </div>
      </main>

      {draft && (
        <NewHighlightToolbar
          draft={draft}
          onDismiss={() => {
            setDraft(null);
            window.getSelection()?.removeAllRanges();
          }}
          onSave={onSaveNew}
        />
      )}
    </div>
  );
}

function layoutAnnotationCards(
  highlights: PassageHighlight[],
  desiredTops: Record<string, number>,
  selectedId: string | null
) {
  const sorted = [...highlights].sort(
    (a, b) => (desiredTops[a.id] ?? 0) - (desiredTops[b.id] ?? 0)
  );
  const heightFor = (id: string) =>
    id === selectedId ? ANNOTATION_CARD_EDIT_HEIGHT : ANNOTATION_CARD_VIEW_HEIGHT;
  const tops: Record<string, number> = {};
  if (sorted.length === 0) return tops;

  const selectedIndex = selectedId
    ? sorted.findIndex((highlight) => highlight.id === selectedId)
    : -1;

  if (selectedIndex < 0) {
    let bottom = 0;
    for (const highlight of sorted) {
      const top = Math.max(desiredTops[highlight.id] ?? 0, bottom);
      tops[highlight.id] = top;
      bottom = top + heightFor(highlight.id) + ANNOTATION_CARD_GAP;
    }
    return tops;
  }

  const selected = sorted[selectedIndex];
  const selectedTop = Math.max(0, desiredTops[selected.id] ?? 0);
  tops[selected.id] = selectedTop;

  let nextTop = selectedTop;
  for (let i = selectedIndex - 1; i >= 0; i -= 1) {
    const highlight = sorted[i];
    const height = heightFor(highlight.id);
    const preferred = desiredTops[highlight.id] ?? 0;
    const top = Math.min(preferred, nextTop - height - ANNOTATION_CARD_GAP);
    tops[highlight.id] = Math.max(0, top);
    nextTop = tops[highlight.id];
  }

  let bottom = selectedTop + heightFor(selected.id) + ANNOTATION_CARD_GAP;
  for (let i = selectedIndex + 1; i < sorted.length; i += 1) {
    const highlight = sorted[i];
    const top = Math.max(desiredTops[highlight.id] ?? 0, bottom);
    tops[highlight.id] = top;
    bottom = top + heightFor(highlight.id) + ANNOTATION_CARD_GAP;
  }

  return tops;
}

function AnnotationGutter({
  highlights,
  cardTops,
  editingHighlightId,
  onEdit,
  onSave,
  onColorChange,
  onDelete,
}: {
  highlights: PassageHighlight[];
  cardTops: Record<string, number>;
  editingHighlightId: string | null;
  onEdit: (id: string | null) => void;
  onSave: (id: string, note: string, color: string) => void;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const laidOutTops = layoutAnnotationCards(
    highlights,
    cardTops,
    editingHighlightId
  );

  return (
    <aside
      aria-label="Annotations"
      style={{
        position: "relative",
        width: ANNOTATION_GUTTER_WIDTH,
        minHeight: 1080,
        flexShrink: 0,
      }}
    >
      {highlights.map((highlight, index) => (
        <div
          key={highlight.id}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: laidOutTops[highlight.id] ?? 64 + index * 160,
            transition: "top var(--transition-base)",
          }}
        >
          <AnnotationMarginCard
            key={highlight.id}
            highlight={highlight}
            editing={editingHighlightId === highlight.id}
            onEdit={() => onEdit(highlight.id)}
            onSave={(note, color) => onSave(highlight.id, note, color)}
            onColorChange={(color) => onColorChange(highlight.id, color)}
            onDelete={() => onDelete(highlight.id)}
          />
        </div>
      ))}
    </aside>
  );
}

function AnnotationMarginCard({
  highlight,
  editing,
  onEdit,
  onSave,
  onColorChange,
  onDelete,
}: {
  highlight: PassageHighlight;
  editing: boolean;
  onEdit: () => void;
  onSave: (note: string, color: string) => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(highlight.note);
  const [color, setColor] = useState(highlight.color);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!colorMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (colorMenuRef.current?.contains(event.target as Node)) return;
      setColorMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [colorMenuOpen]);

  return (
    <div
      data-annotation-card
      onClick={() => {
        if (!editing) onEdit();
      }}
      style={{
        width: 240,
        overflow: "visible",
        borderRadius: 12,
        background: "var(--color-paper-white)",
        border: "1px solid var(--color-hairline)",
        boxShadow:
          "0 1px 0 rgba(39,37,30,0.04), 0 10px 28px rgba(39,37,30,0.08)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px 10px",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-caption)",
            lineHeight: "16px",
            color: "var(--color-faded-stone)",
          }}
        >
          {formatRelativeTime(highlight.createdAt)}
        </span>
        <div
          ref={colorMenuRef}
          style={{ position: "relative", display: "flex", alignItems: "center" }}
        >
          <button
            type="button"
            aria-label="Change highlight color"
            onClick={(event) => {
              event.stopPropagation();
              if (!editing) onEdit();
              setColorMenuOpen((open) => !open);
            }}
            style={{
              width: 20,
              height: 20,
              flexShrink: 0,
              padding: 0,
              background: color,
              border: `1px solid ${getHighlightBorder(color)}`,
              cursor: "pointer",
            }}
          />
          {colorMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: 28,
                right: 0,
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 9,
                padding: 6,
                borderRadius: 13,
                background: "var(--color-paper-white)",
                border: "1px solid var(--color-hairline)",
                boxShadow:
                  "0 2px 3px rgba(0,0,0,0.12), 0 8px 22px rgba(39,37,30,0.08)",
              }}
            >
              {HIGHLIGHT_PALETTE.map((palette) => (
                <button
                  key={palette.key}
                  type="button"
                  title={palette.key}
                  onClick={(event) => {
                    event.stopPropagation();
                    setColor(palette.color);
                    onColorChange(palette.color);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    padding: 2,
                    borderRadius: 5,
                    border:
                      color === palette.color
                        ? `1px solid ${palette.border}`
                        : "1px solid transparent",
                    background:
                      color === palette.color
                        ? "var(--color-parchment)"
                        : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      background: palette.color,
                      border: `1px solid ${
                        color === palette.color
                          ? palette.border
                          : "rgba(221,221,221,0.5)"
                      }`,
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 1, background: "var(--color-hairline)" }} />
      <div style={{ padding: "12px 14px" }}>
        {editing ? (
          <textarea
            onClick={(event) => event.stopPropagation()}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              border: "1px solid var(--color-hairline)",
              borderRadius: 8,
              outline: "none",
              background: "var(--color-parchment)",
              padding: 8,
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-caption)",
              lineHeight: "16px",
              color: "var(--color-inkwell)",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: "var(--text-caption)",
              lineHeight: "16px",
              color: "var(--color-inkwell)",
            }}
          >
            {highlight.note}
          </div>
        )}
      </div>
      {editing && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px 10px",
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 0",
                color: "#b45353",
                cursor: "pointer",
                fontSize: "var(--text-caption)",
              }}
            >
              Remove
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSave(note, color);
              }}
              style={{
                border: "1px solid var(--color-graphite)",
                background: "var(--color-graphite)",
                color: "var(--color-paper-white)",
                borderRadius: "var(--radius-pill)",
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: "var(--text-caption)",
              }}
            >
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function formatRelativeTime(createdAt: number) {
  const minutes = Math.max(1, Math.round((Date.now() - createdAt) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}

function getHighlightBorder(color: string) {
  return HIGHLIGHT_PALETTE.find((p) => p.color === color)?.border ?? "var(--color-hairline)";
}

function Section({
  id,
  title,
  children,
  lastSection,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  lastSection?: boolean;
}) {
  return (
    <section id={id} style={{ marginBottom: lastSection ? 0 : 40 }}>
      <h2 style={headingStyle}>{title}</h2>
      {children}
    </section>
  );
}

function Block({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return <div id={id}>{children}</div>;
}

function P({
  blockId,
  highlights,
}: {
  blockId: string;
  highlights: import("./highlightTypes").PassageHighlight[];
}) {
  return (
    <HighlightableBlock
      blockId={blockId}
      anchorId={`${blockId}-anchor`}
      paragraphStyle={paragraphStyle}
      runs={STORY_RUNS[blockId]}
      highlights={highlights}
    />
  );
}
