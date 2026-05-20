import { useCallback, useEffect, useRef, useState } from "react";
import { HighlightableBlock } from "./HighlightableBlock";
import StoryTimeline from "./StoryTimeline";
import { STORY_RUNS } from "./storyRuns";
import { flattenRuns, getTextOffsetInBlock } from "./highlightText";
import type { StoryEvent } from "./timeline.types";
import {
  InspectHighlightToolbar,
  NewHighlightToolbar,
  type DraftState,
  type InspectState,
} from "./SelectionToolbar";
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

export function CloseReading() {
  const { state, addHighlight, updateHighlight, removeHighlight } = useSession();
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [inspect, setInspect] = useState<InspectState | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);

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
      setInspect(null);
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

  /* Click on existing highlight → open inspect toolbar. */
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
      const r = t.getBoundingClientRect();
      setDraft(null);
      window.getSelection()?.removeAllRanges();
      setInspect({
        id,
        left: r.left + r.width / 2,
        top: r.bottom + 8,
      });
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
      setDraft(null);
      window.getSelection()?.removeAllRanges();
    },
    [addHighlight, draft]
  );

  const inspectingHighlight = inspect
    ? state.highlights.find((h) => h.id === inspect.id)
    : undefined;

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        background: "var(--color-paper-white)",
        overflowY: "auto",
      }}
    >
      <StoryTimeline events={EVENTS} />

      <main
        style={{
          marginLeft: 200,
          padding: "48px 56px 96px",
          fontFamily: "Georgia, 'Source Serif Pro', serif",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 760 }}>
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
      {inspect && inspectingHighlight && (
        <InspectHighlightToolbar
          inspect={inspect}
          highlight={inspectingHighlight}
          onDismiss={() => setInspect(null)}
          onSave={(note, color) =>
            updateHighlight(inspect.id, {
              note: note.trim(),
              ...(color ? { color } : {}),
            })
          }
          onDelete={() => {
            removeHighlight(inspect.id);
            setInspect(null);
          }}
        />
      )}
    </div>
  );
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
