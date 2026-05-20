export type TextRun =
  | { kind: "plain"; text: string }
  | { kind: "em"; text: string }
  | { kind: "link"; text: string; href: string };

export type PassageHighlight = {
  id: string;
  blockId: string;
  start: number;
  end: number;
  /** Plain text snapshot of the highlighted span, kept for use on the Interpretation Canvas. */
  quote: string;
  /** Section label (e.g. "Prince Prospero's Retreat") — used by the canvas card. */
  sectionLabel?: string;
  color: string;
  note: string;
  createdAt: number;
};

export const HIGHLIGHT_PALETTE = [
  {
    key: "yellow",
    color: "rgba(254, 240, 138, 0.85)",
    border: "rgba(202, 138, 4, 0.35)",
  },
  {
    key: "green",
    color: "rgba(187, 247, 208, 0.85)",
    border: "rgba(22, 163, 74, 0.35)",
  },
  {
    key: "blue",
    color: "rgba(191, 219, 254, 0.88)",
    border: "rgba(37, 99, 235, 0.35)",
  },
  {
    key: "rose",
    color: "rgba(251, 207, 232, 0.88)",
    border: "rgba(219, 39, 119, 0.3)",
  },
] as const;
