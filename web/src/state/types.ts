import type { PassageHighlight } from "../closeReading/highlightTypes";
import type { EssayComment } from "../lib/ai";

export type CardStatus = "unset" | "green" | "yellow" | "red";

export type AnnotationCard = {
  id: string;
  /** The id of the underlying PassageHighlight this card mirrors. */
  highlightId: string;
  x: number;
  y: number;
  status: CardStatus;
  minimized: boolean;
};

export type CanvasGroup = {
  id: string;
  label: string;
  /** Box in canvas coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  cardIds: string[];
};

export type CanvasConnection = {
  id: string;
  fromCardId: string;
  toCardId: string;
  label: string;
};

export type EssayBlockType =
  | "text"
  | "topic-sentence"
  | "thesis-statement"
  | "annotation-card";

export type EssayBlock = {
  id: string;
  type: EssayBlockType;
  /** Plain text for `text` and `topic-sentence`. */
  content?: string;
  /** Card id reference, used when `type === "annotation-card"`. */
  cardId?: string;
};

export type EssaySection = {
  id: string;
  label: string;
  blocks: EssayBlock[];
};

export type TabKey =
  | "close-reading"
  | "interpretation"
  | "thesis"
  | "structure"
  | "writing";

export type TabState = {
  openTabs: TabKey[];
  activeTab: TabKey;
};

export type SessionState = {
  /** Has the student finished the Gut Reaction step? Tabs are locked until true. */
  gutReactionComplete: boolean;
  initialStance: string;

  prompt: string;

  highlights: PassageHighlight[];

  cards: AnnotationCard[];
  groups: CanvasGroup[];
  connections: CanvasConnection[];
  /** Cached AI summary of the Interpretation Canvas. */
  canvasSummary: string;

  thesis: string;
  thesisCritique: string;

  /** When false, the canvas cards keep their seeded positions; user can rearrange. */
  canvasDirty: boolean;

  essaySections: EssaySection[];
  structureFeedback: string;

  essayDraft: string;
  essayComments: EssayComment[];

  tabs: TabState;
};
