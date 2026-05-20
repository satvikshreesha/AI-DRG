import { uid } from "../lib/id";
import type {
  AnnotationCard,
  EssaySection,
  SessionState,
} from "./types";
import {
  HIGHLIGHT_PALETTE,
  type PassageHighlight,
} from "../closeReading/highlightTypes";
import { flattenRuns } from "../closeReading/highlightText";
import { STORY_RUNS } from "../closeReading/storyRuns";

const PROMPT =
  'In "The Masque of the Red Death," Edgar Allan Poe suggests that no walls, no wealth, and no spectacle can keep death out. To what extent does the story support this claim? Use specific textual evidence from the abbey, the seven rooms, and the masquerade itself to develop your argument.';

/**
 * Pre-seeded highlights anchored to blocks in the Masque text. These match the
 * `blockId`s used in `closeReading/CloseReading.tsx` (which mirrors the timeline
 * prototype's structure).
 *
 * Each entry is a substring of the block's flattened text — we resolve the
 * exact (start,end) offsets at runtime in `resolveSeedHighlights`.
 */
const SEED_HIGHLIGHT_SPECS: {
  blockId: string;
  match: string;
  color: string;
  note: string;
  sectionLabel: string;
}[] = [
  {
    blockId: "e1a1",
    match: 'No pestilence had been ever so fatal, or so hideous.',
    color: HIGHLIGHT_PALETTE[0].color,
    note: "Poe opens by making the threat absolute. Sets up the stakes for any attempted escape.",
    sectionLabel: "The Red Death Ravages the Land",
  },
  {
    blockId: "e2a2",
    match:
      "brought furnaces and massy hammers and welded the bolts",
    color: HIGHLIGHT_PALETTE[1].color,
    note: "The courtiers actively weld themselves in — denial as physical labor, not just retreat.",
    sectionLabel: "Prince Prospero's Retreat",
  },
  {
    blockId: "e2b2",
    match:
      "All these and security were within. Without was the \u201CRed Death.\u201D",
    color: HIGHLIGHT_PALETTE[2].color,
    note: 'The "within" / "without" binary frames the entire story. Death is exiled to the outside.',
    sectionLabel: "Prince Prospero's Retreat",
  },
  {
    blockId: "e3c1",
    match:
      "there stood against the western wall, a gigantic clock of ebony",
    color: HIGHLIGHT_PALETTE[0].color,
    note: "Even inside the abbey, time keeps marking itself — the clock is the only thing the revelers cannot ignore.",
    sectionLabel: "The Seven Rooms",
  },
  {
    blockId: "e7b2",
    match:
      "And one by one dropped the revellers in the blood-bedewed halls of their revel",
    color: HIGHLIGHT_PALETTE[3].color,
    note: "The closing image collapses the binary: the revel itself becomes the site of death.",
    sectionLabel: "Death Comes for All",
  },
];

export function getSeedHighlightSpecs() {
  return SEED_HIGHLIGHT_SPECS;
}

/** Resolves each seed spec to a `PassageHighlight` with concrete offsets. */
function buildSeedHighlights(): PassageHighlight[] {
  const out: PassageHighlight[] = [];
  for (const spec of SEED_HIGHLIGHT_SPECS) {
    const runs = STORY_RUNS[spec.blockId];
    if (!runs) continue;
    const text = flattenRuns(runs);
    const start = text.indexOf(spec.match);
    if (start < 0) continue;
    const end = start + spec.match.length;
    out.push({
      id: uid("hl"),
      blockId: spec.blockId,
      start,
      end,
      quote: spec.match,
      sectionLabel: spec.sectionLabel,
      color: spec.color,
      note: spec.note,
      createdAt: Date.now(),
    });
  }
  return out;
}

function defaultEssaySections(): EssaySection[] {
  return [
    { id: uid("sec"), label: "Intro", blocks: [] },
    { id: uid("sec"), label: "BP1", blocks: [] },
    { id: uid("sec"), label: "BP2", blocks: [] },
    { id: uid("sec"), label: "Conclusion", blocks: [] },
  ];
}

const DEMO_INITIAL_STANCE =
  "Poe seems to argue that no amount of wealth or planning can outrun death. Prospero builds the abbey precisely to deny that, and the story spends most of its time showing the denial collapse.";

export function createSeedSession(): SessionState {
  const highlights = buildSeedHighlights();
  const cards: AnnotationCard[] = defaultCardLayout(
    highlights.map((h) => h.id)
  ).map((spec, i) => ({ ...spec, highlightId: highlights[i].id }));

  return {
    gutReactionComplete: false,
    initialStance: "",
    prompt: PROMPT,
    highlights,
    cards,
    groups: [],
    connections: [],
    canvasSummary: "",
    canvasDirty: false,
    thesis: "",
    thesisCritique: "",
    essaySections: defaultEssaySections(),
    structureFeedback: "",
    essayDraft: "",
    essayComments: [],
    tabs: {
      openTabs: ["close-reading"],
      activeTab: "close-reading",
    },
  };
}

/** Variant of the seed where the Gut Reaction is already filled out, so the
 * demo can jump straight into the thinking tools. */
export function createSkipToCloseReadingSession(): SessionState {
  return {
    ...createSeedSession(),
    gutReactionComplete: true,
    initialStance: DEMO_INITIAL_STANCE,
  };
}

/** Layout cards in a tidy grid for the initial canvas state. */
export function defaultCardLayout(
  highlightIds: string[]
): Omit<AnnotationCard, "highlightId">[] {
  const cardW = 230;
  const cardH = 220;
  const gap = 24;
  const cols = Math.max(1, Math.min(highlightIds.length, 5));
  return highlightIds.map((_, i) => ({
    id: uid("card"),
    x: 24 + (i % cols) * (cardW + gap),
    y: 24 + Math.floor(i / cols) * (cardH + gap),
    status: "unset",
    minimized: false,
  }));
}
