/*
 * Hybrid AI helper.
 *
 * Strategy:
 *   1. If `VITE_OPENAI_API_KEY` is configured at build time, the helper makes
 *      a real Chat Completions request. (Demo only — no key proxying.)
 *   2. Otherwise it falls back to deterministic, keyword-driven scripted
 *      responses written specifically for "The Masque of the Red Death."
 *
 * The fallback is intentionally opinionated rather than generic: it should
 * feel like a thoughtful teacher's voice that pushes thinking rather than
 * gives away answers.
 */

import type { PassageHighlight } from "../closeReading/highlightTypes";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OPENAI_MODEL =
  (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? "gpt-4o-mini";

export const aiMode: "live" | "scripted" = OPENAI_KEY ? "live" : "scripted";

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

const TEACHER_SYSTEM_PROMPT = `You are an English teacher coaching a high-school student through writing an in-class essay about Edgar Allan Poe's "The Masque of the Red Death." You never write the essay for them or hand them new ideas wholesale. You ask questions, push back on assumptions, and point out logical or textual gaps so the student does the thinking. Keep responses under 90 words. Use a calm, focused, professional voice — no exclamation points, no emojis.`;

/* ---------------------------------------------------------------- */
/* Interpretation Canvas → AI summary                                  */
/* ---------------------------------------------------------------- */

export type CanvasSummaryInput = {
  highlights: PassageHighlight[];
  /** Group name → list of highlight ids. */
  groups: { id: string; label: string; highlightIds: string[] }[];
  /** Free-form connections between two cards. */
  connections: { fromId: string; toId: string; label?: string }[];
};

export async function summarizeCanvas(
  input: CanvasSummaryInput
): Promise<string> {
  if (aiMode === "live") {
    const compact = {
      highlights: input.highlights.map((h) => ({
        id: h.id,
        quote: h.quote.slice(0, 200),
        note: h.note,
      })),
      groups: input.groups,
      connections: input.connections,
    };
    const messages: ChatMessage[] = [
      { role: "system", content: TEACHER_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          "Summarize this student's interpretation canvas in 3-4 sentences. Surface the strongest 1-2 themes their groupings imply, name the two clearest quotes by their content, and end by suggesting what the thesis might begin to argue. Do not write a thesis for them. Use bold (**word**) sparingly for the two themes. Input JSON: " +
          JSON.stringify(compact),
      },
    ];
    try {
      return await callOpenAI(messages);
    } catch (e) {
      console.warn("AI summary fell back to scripted:", e);
    }
  }

  return scriptedCanvasSummary(input);
}

function scriptedCanvasSummary(input: CanvasSummaryInput): string {
  const themes = input.groups.map((g) => g.label).filter(Boolean);
  const themeText =
    themes.length >= 2
      ? `**${themes[0]}** and **${themes[1]}**`
      : themes.length === 1
        ? `**${themes[0]}**`
        : "**isolation** and **the inevitability of death**";

  const topQuotes = input.highlights
    .slice()
    .sort((a, b) => (b.note?.length ?? 0) - (a.note?.length ?? 0))
    .slice(0, 2);
  const quoteSnips =
    topQuotes.length === 2
      ? `quotes like "${topQuotes[0].quote.slice(0, 70)}…" and "${topQuotes[1].quote.slice(0, 70)}…"`
      : "the quotes you marked from the abbey and the masquerade";

  return `Based on your Interpretation Canvas, you've gathered evidence that points toward ${themeText}. With ${quoteSnips}, you've started building the case that the story treats death not just as an event but as something Prospero's wealth and walls cannot keep out. A thesis here might begin by naming what Poe is arguing about *who* gets to escape death — and what the answer reveals about the abbey itself.`;
}

/* ---------------------------------------------------------------- */
/* Thesis critique                                                      */
/* ---------------------------------------------------------------- */

export async function critiqueThesis(thesis: string): Promise<string> {
  if (aiMode === "live") {
    const messages: ChatMessage[] = [
      { role: "system", content: TEACHER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `The student's draft thesis for an essay on "The Masque of the Red Death" is:\n\n"${thesis}"\n\nWrite 2 short paragraphs that poke holes in this thesis. Be specific. Call out vague terms, missing nuance, or assumptions that aren't supported by the text. End by naming one direction the student could sharpen.`,
      },
    ];
    try {
      return await callOpenAI(messages);
    } catch (e) {
      console.warn("AI critique fell back to scripted:", e);
    }
  }

  return scriptedThesisCritique(thesis);
}

function scriptedThesisCritique(thesis: string): string {
  const t = thesis.toLowerCase();
  const has = (...needles: string[]) => needles.some((n) => t.includes(n));

  const paragraphs: string[] = [];

  if (has("death", "mortality", "die")) {
    paragraphs.push(
      "You're naming death as the central concern, but the thesis doesn't yet take a position on *what about death* Poe is arguing. Is it that death is inevitable? That wealth fails as a defense against it? That denial accelerates it? Each of those leads to a different essay. As written, a reader could agree without learning anything specific about Prospero or the seven rooms."
    );
  } else if (has("wealth", "class", "power", "rich")) {
    paragraphs.push(
      "The class-and-power angle is promising, but the thesis treats Prospero's wealth as the main target without grappling with the masquerade itself. The story spends most of its pages on the rooms and the dance, not on Prospero's money. Be sure your claim accounts for *why* Poe stages the failure inside a party, not, say, inside a treasury."
    );
  } else if (has("denial", "ignore", "escape", "avoid")) {
    paragraphs.push(
      "Framing the story around denial works, but the thesis needs to name who is doing the denying and what makes the denial recognizable. Prospero isn't simply ignoring death — he's stage-managing an alternate reality. A stronger version distinguishes denial from performance, and ties the seven rooms to that distinction."
    );
  } else {
    paragraphs.push(
      "The thesis states a position but doesn't yet commit to a specific claim about the text. What is Poe arguing, and how do the seven rooms, the ebony clock, or Prospero himself function as evidence for that argument? Right now a reader could agree with you without having read the story."
    );
  }

  if (has("symbol", "symbolize", "represent")) {
    paragraphs.push(
      "Saying something \"symbolizes\" something else is a starting point, not a thesis. What is Poe *doing* with the symbol — accusing, warning, mocking? Try replacing the word \"symbolize\" with an active verb that names Poe's stance toward what he's depicting. One direction to sharpen: pick the single most important image (the clock, the black room, the masked figure) and write a thesis that could not have been written about a different image."
    );
  } else {
    paragraphs.push(
      "One direction to sharpen: pick the single image you'd be most willing to write a body paragraph about — the ebony clock, the black room, the masked figure — and rewrite the thesis so it could not have been written without that image at the center. That forces the claim out of the abstract."
    );
  }

  return paragraphs.join("\n\n");
}

/* ---------------------------------------------------------------- */
/* Essay structure feedback                                            */
/* ---------------------------------------------------------------- */

export type StructureFeedbackInput = {
  thesis: string;
  paragraphs: { label: string; preview: string }[];
};

export async function critiqueStructure(
  input: StructureFeedbackInput
): Promise<string> {
  if (aiMode === "live") {
    const messages: ChatMessage[] = [
      { role: "system", content: TEACHER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is a student's essay outline. Comment on the flow and the way each body paragraph supports the thesis. 90 words max.\n\n${JSON.stringify(input)}`,
      },
    ];
    try {
      return await callOpenAI(messages);
    } catch (e) {
      console.warn("AI structure feedback fell back to scripted:", e);
    }
  }

  const empty = input.paragraphs.filter((p) => !p.preview.trim()).length;
  if (empty >= input.paragraphs.length - 1) {
    return "There isn't enough content yet to assess the flow. Add at least a topic sentence and one piece of evidence to each body paragraph and ask for feedback again.";
  }
  return "The intro lands the thesis quickly, which is good. Body 1 introduces evidence but doesn't yet name what the evidence proves — that's the move that connects the quote to the thesis. Body 2 is heavier on commentary than evidence; consider pulling in one of the abbey-wall quotes you flagged on the canvas. The conclusion currently restates the thesis without acknowledging the strongest counter-reading you've raised. Naming the counter-reading and dismissing it would make the close feel earned.";
}

/* ---------------------------------------------------------------- */
/* Essay writing comments                                              */
/* ---------------------------------------------------------------- */

export type EssayComment = {
  id: string;
  /** Character offset in the essay text. */
  start: number;
  end: number;
  /** Type of feedback: "argument" critiques reasoning, "grammar" is light polish. */
  kind: "argument" | "grammar" | "evidence";
  message: string;
};

export async function critiqueEssay(essay: string): Promise<EssayComment[]> {
  if (aiMode === "live") {
    const messages: ChatMessage[] = [
      { role: "system", content: TEACHER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Read this draft essay and return JSON with up to 5 inline comments. Each comment must include {start, end, kind, message}, where start/end are 0-indexed character offsets into the original essay text and kind is one of "argument", "evidence", or "grammar". Keep messages under 30 words. Essay:\n\n${essay}`,
      },
    ];
    try {
      const raw = await callOpenAI(messages);
      const jsonStart = raw.indexOf("[");
      const jsonEnd = raw.lastIndexOf("]");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (c: { start: number; end: number; message: string }) =>
                typeof c.start === "number" &&
                typeof c.end === "number" &&
                typeof c.message === "string"
            )
            .slice(0, 5)
            .map(
              (
                c: {
                  start: number;
                  end: number;
                  message: string;
                  kind?: EssayComment["kind"];
                },
                i: number
              ) => ({
                id: `c_${i}`,
                start: c.start,
                end: c.end,
                kind: c.kind ?? "argument",
                message: c.message,
              })
            );
        }
      }
    } catch (e) {
      console.warn("AI essay comments fell back to scripted:", e);
    }
  }

  return scriptedEssayComments(essay);
}

function scriptedEssayComments(essay: string): EssayComment[] {
  const comments: EssayComment[] = [];
  if (!essay.trim()) return comments;

  const sentences = essay.split(/(?<=[.!?])\s+/);
  let cursor = 0;
  let argumentCount = 0;
  let evidenceCount = 0;
  let grammarCount = 0;
  const grammarTargets = [
    {
      re: /\b(very|really|quite|kind of|sort of)\b/i,
      msg: "Hedge words like this dilute the claim. Cut or replace with a more specific verb.",
    },
    {
      re: /\bthing\b/i,
      msg: "\"Thing\" is doing too much work here. Name what specifically you mean.",
    },
    {
      re: /\bin order to\b/i,
      msg: 'Tighten: "in order to" can almost always become "to".',
    },
  ];

  for (const sentence of sentences) {
    const start = cursor;
    const end = cursor + sentence.length;
    cursor += sentence.length + 1;

    if (sentence.length < 4) continue;

    if (
      argumentCount < 2 &&
      /\b(shows|represents|symbolizes|means)\b/i.test(sentence)
    ) {
      argumentCount++;
      comments.push({
        id: `arg_${comments.length}`,
        start,
        end,
        kind: "argument",
        message:
          "Watch for shorthand verbs like \"shows\" or \"represents\" — they tend to skip the reasoning. What does Poe do with this image, and how does the reader know?",
      });
      continue;
    }

    if (
      evidenceCount < 1 &&
      /Prospero|abbey|clock|red death|ebony|masquerade/i.test(sentence) &&
      !sentence.includes('"') &&
      !sentence.includes("\u201C")
    ) {
      evidenceCount++;
      comments.push({
        id: `ev_${comments.length}`,
        start,
        end,
        kind: "evidence",
        message:
          "This sentence makes a claim about the story but doesn't anchor itself to a specific quote. Pull one from your Interpretation Canvas.",
      });
      continue;
    }

    for (const g of grammarTargets) {
      if (grammarCount >= 2) break;
      const m = sentence.match(g.re);
      if (m && typeof m.index === "number") {
        comments.push({
          id: `gr_${comments.length}`,
          start: start + m.index,
          end: start + m.index + m[0].length,
          kind: "grammar",
          message: g.msg,
        });
        grammarCount++;
        break;
      }
    }

    if (comments.length >= 5) break;
  }

  return comments;
}
