import { useEffect, useRef, useState } from "react";
import { SoftGradientBackground } from "../components/SoftGradientBackground";
import { useSession } from "../state/SessionProvider";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (on mount)
 *
 *  200ms   prompt, explanation, countdown fade in (600ms)
 *  600ms   gradient blob 1 fades in (600ms)
 *  800ms   gradient blob 2 fades in (600ms)
 * 1000ms   gradient blob 3 fades in (600ms)
 *
 * Timing tokens in globals.css — tune independently:
 *   --gut-content-fade-*  prompt / explanation / countdown
 *   --gut-blob-fade-*     gradient blobs
 * ───────────────────────────────────────────────────────── */

const COUNT_SECONDS = 30;
const CONTENT_MAX_WIDTH_PX = 600;
const PROMPT_TOP_PX = 160;
const GAP_AFTER_PROMPT_PX = 48;
const GAP_BEFORE_COUNTDOWN_PX = 64;
const GAP_BEFORE_INPUT_PX = 24;

export function GutReaction() {
  const { state, setInitialStance, completeGutReaction } = useSession();
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    startedAt.current = Date.now();
    const id = window.setInterval(() => {
      const next = Math.min(
        COUNT_SECONDS,
        Math.floor((Date.now() - startedAt.current) / 1000)
      );
      setElapsed(next);
      if (next >= COUNT_SECONDS) {
        window.clearInterval(id);
        setDone(true);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const canContinue = done && state.initialStance.trim().length > 0;

  return (
    <div
      style={{
        height: "100%",
        position: "relative",
        background: "var(--color-parchment)",
        overflow: "hidden",
      }}
    >
      <SoftGradientBackground phase={done ? "settled" : "thinking"} />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: PROMPT_TOP_PX,
          paddingBottom: 60,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: CONTENT_MAX_WIDTH_PX,
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
        <div
          className="gut-reaction-content-enter"
          style={{
            width: "100%",
            maxWidth: CONTENT_MAX_WIDTH_PX,
            textAlign: "center",
            fontFamily: "var(--font-serif)",
            fontSize: 20,
            lineHeight: 1.3,
            color: "var(--color-inkwell)",
          }}
        >
          {state.prompt}
        </div>

        <p
          className="gut-reaction-content-enter"
          style={{
            width: "100%",
            maxWidth: CONTENT_MAX_WIDTH_PX,
            margin: `${GAP_AFTER_PROMPT_PX}px 0 0`,
            color: "var(--color-dusk-gray)",
            fontSize: "var(--text-body-sm)",
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {done
            ? "Respond to the prompt, nothing fancy, just your initial position after thinking."
            : "Take thirty seconds to think about your stance on this prompt."}
        </p>

        <div
          style={{
            width: "100%",
            maxWidth: CONTENT_MAX_WIDTH_PX,
            marginTop: done ? GAP_BEFORE_INPUT_PX : GAP_BEFORE_COUNTDOWN_PX,
            ...(!done
              ? { display: "flex", justifyContent: "center" }
              : {}),
          }}
        >
          {!done ? (
            <CalmPulse elapsed={elapsed} />
          ) : (
            <div
              className="gut-reaction-settle-in"
              style={{ width: "100%", maxWidth: CONTENT_MAX_WIDTH_PX }}
            >
              <StanceInput
                value={state.initialStance}
                onChange={setInitialStance}
                canContinue={canContinue}
                onContinue={completeGutReaction}
              />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function CalmPulse({ elapsed }: { elapsed: number }) {
  const tens = Math.floor(elapsed / 10);
  const ones = elapsed % 10;
  const label = `${elapsed} seconds`;

  return (
    <div
      className="gut-countdown gut-reaction-content-enter"
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
      style={{
        fontSize: 96,
        fontWeight: "var(--weight-regular)",
        color: "var(--color-dusk-inkwell)",
        letterSpacing: "-0.02em",
        width: "100%",
        maxWidth: CONTENT_MAX_WIDTH_PX,
      }}
    >
      <CountdownDigit value={tens} max={3} />
      <CountdownDigit value={ones} max={9} />
    </div>
  );
}

function CountdownDigit({ value, max }: { value: number; max: number }) {
  const digits = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <span className="gut-countdown-digit" aria-hidden>
      <span
        className="gut-countdown-digit-track"
        style={{ transform: `translateY(-${value}em)` }}
      >
        {digits.map((digit) => (
          <span key={digit} className="gut-countdown-digit-cell">
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}

function StanceInput({
  value,
  onChange,
  canContinue,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-card)",
        padding: 16,
        background: "var(--color-paper-white)",
      }}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your initial stance here..."
        rows={4}
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          resize: "none",
          fontSize: "var(--text-body)",
          lineHeight: 1.5,
          color: "var(--color-inkwell)",
          fontFamily: "inherit",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 12,
        }}
      >
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          style={{
            background: canContinue
              ? "var(--color-graphite)"
              : "var(--color-paper-white)",
            color: canContinue
              ? "var(--color-paper-white)"
              : "var(--color-faded-stone)",
            border: canContinue
              ? "1px solid var(--color-graphite)"
              : "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-pill)",
            padding: "8px 18px",
            fontSize: "var(--text-body-sm)",
            cursor: canContinue ? "pointer" : "not-allowed",
            transition: "background var(--transition-fast)",
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
