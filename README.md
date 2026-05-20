# Tabula — structured thinking for writing

A demo MVP web app for high-school AP-Lit and early-college students. Tabula
guides a student through the work *behind* an essay: gut reaction, close
reading, evidence organization, thesis sharpening, structural blocking-out,
and final draft. AI features are deliberately limited — they push the
student's thinking rather than replace it.

The demo session is built around Edgar Allan Poe's
**"The Masque of the Red Death"**.

## Run it

```bash
cd web
npm install
npm run dev
```

Then open the URL printed by Vite (typically <http://localhost:5173>).

### Optional: live AI

By default, all AI features (canvas summary, thesis critique, structure
feedback, essay comments) use deterministic scripted responses tuned for the
Masque text. To use real AI, copy the env example and add an OpenAI key:

```bash
cp web/.env.example web/.env.local
# edit .env.local and set VITE_OPENAI_API_KEY
```

The footer of the tab bar shows `AI live` or `AI scripted` so you know which
mode is active.

## Demo flow

The seeded session ships in a partial state:

- **Gut reaction** already done (initial stance is pre-filled).
- **Close reading** has five pre-existing highlights/annotations on the
  Masque text (abbey walls, the ebony clock, the closing image, etc.).
- **Interpretation Canvas / Thesis / Structure / Writing** are blank, so the
  demo focuses on the thinking tools.

Hit **Reset** in the tab bar (top-right) to either:

1. Restore the pre-seeded state, or
2. Start fully fresh, dropped at the 30-second Gut Reaction screen.

Both states persist to `localStorage` automatically — you can refresh at any
time without losing your work.

## Architecture

- **Stack:** Vite + React 19 + TypeScript, no other runtime dependencies.
- **State:** A single `SessionProvider` context (see `web/src/state/`) holds
  everything (highlights, canvas cards, groups, connections, thesis, essay
  blocks, draft, AI cache, tabs). It auto-persists to `localStorage`.
- **Design system:** A restrained Perplexity-inspired palette of off-whites
  and grays, defined in `web/src/styles/tokens.css`. Pill-shaped buttons,
  16px card radius, 8px input radius. Inter as a substitute for `pplxSans`.
- **Story timeline:** The left-rail timeline and the
  highlight/annotate primitives are ported from the existing
  `story-timeline-slider` prototype, with the highlight state plugged into
  Tabula's central session store.
- **Tabs:** Chrome-style tabs at the top, opened from a `+` menu. The
  Writing tab stays locked until at least one block exists in the
  Essay Structure.
- **AI:** `web/src/lib/ai.ts` is a small hybrid client — it dispatches to
  OpenAI when a key is present, otherwise hand-written scripted responses
  designed to feel like a teacher pushing the student to sharpen their
  thinking rather than handing them answers.

## Screens

| Screen              | What it does                                                                           |
| ------------------- | -------------------------------------------------------------------------------------- |
| Landing             | Pick Student session or Teacher dashboard.                                             |
| Gut Reaction        | Prompt + 30-second count-up + initial stance input.                                    |
| Close Reading       | Story timeline on the left, the Masque text on the right. Select to highlight + note. |
| Interpretation Canvas | FigJam-ish board: drag cards, draw rectangle groups, click-to-click connections.     |
| Thesis Formation    | AI summary of the canvas + thesis input + AI critique.                                 |
| Essay Structure     | Notion-ish drag-and-drop blocks (text, topic sentence, thesis, annotation cards).      |
| Essay Writing       | Doc editor + side panel of AI comments tagged Argument / Evidence / Polish.            |
| Teacher Dashboard   | Static mock: classes, assignments, submission roster.                                  |

## Constraints

This is a demo. Things deliberately not done:

- No backend, no auth, no per-user storage.
- No "lockdown browser" mode — it's a normal web tab.
- Teacher dashboard is a visual mock; clicking through doesn't actually
  load any real student work.
