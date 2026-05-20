import type { PassageHighlight, TextRun } from "./highlightTypes";

export function flattenRuns(runs: TextRun[]): string {
  return runs.map((r) => r.text).join("");
}

/** For each character index in flattened text, which run index it belongs to. */
export function buildCharToRunIndex(runs: TextRun[]): number[] {
  const map: number[] = [];
  runs.forEach((run, runIndex) => {
    for (let i = 0; i < run.text.length; i++) map.push(runIndex);
  });
  return map;
}

function mergeCutPoints(cuts: number[]): number[] {
  const sorted = [...new Set(cuts)].filter((n) => n >= 0).sort((a, b) => a - b);
  const out: number[] = [];
  for (const c of sorted) {
    if (out.length === 0 || out[out.length - 1] !== c) out.push(c);
  }
  return out;
}

/** Walk text nodes under root in document order; return offset from first text char to (node, offset). */
export function getTextOffsetInBlock(
  root: HTMLElement,
  node: Node,
  offset: number
): number | null {
  if (!root.contains(node)) return null;
  let total = 0;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n: Node | null = walk.nextNode();
  while (n) {
    if (n === node) return total + offset;
    total += (n.textContent ?? "").length;
    n = walk.nextNode();
  }
  return null;
}

export type RenderSegment = {
  start: number;
  end: number;
  runIndex: number;
  highlight?: PassageHighlight;
};

export function buildRenderSegments(
  runs: TextRun[],
  highlights: PassageHighlight[],
  blockId: string
): RenderSegment[] {
  const fullLen = flattenRuns(runs).length;
  const charToRun = buildCharToRunIndex(runs);
  const blockHighlights = highlights.filter((h) => h.blockId === blockId);

  const cuts = new Set<number>([0, fullLen]);
  for (let i = 0; i < runs.length; i++) {
    let pos = 0;
    for (let j = 0; j < i; j++) pos += runs[j].text.length;
    cuts.add(pos);
    cuts.add(pos + runs[i].text.length);
  }
  for (const h of blockHighlights) {
    cuts.add(Math.max(0, h.start));
    cuts.add(Math.min(fullLen, h.end));
  }

  const sortedCuts = mergeCutPoints([...cuts]);
  const segments: RenderSegment[] = [];

  for (let i = 0; i < sortedCuts.length - 1; i++) {
    const start = sortedCuts[i];
    const end = sortedCuts[i + 1];
    if (start >= end) continue;
    const mid = start + Math.floor((end - start) / 2);
    const runIndex = charToRun[mid] ?? 0;
    const candidates = blockHighlights.filter(
      (h) => mid >= h.start && mid < h.end
    );
    const highlight =
      candidates.length === 0
        ? undefined
        : candidates.reduce((a, b) =>
            a.end - a.start <= b.end - b.start ? a : b
          );
    segments.push({ start, end, runIndex, highlight });
  }

  return segments;
}
