import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SoftGradientBackground } from "../components/SoftGradientBackground";
import { useSession } from "../state/SessionProvider";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (on mount)
 *
 *  200ms   prompt fades in at viewport center (600ms)
 *  800ms   pause — prompt holds at center (1000ms)
 * 1800ms   prompt slides up to final position (700ms)
 * 2500ms   explanation + countdown fade in (600ms)
 * 3100ms   gradient blob 1 fades in (1200ms)
 * 3700ms   gradient blob 2 fades in (1200ms)
 * 4300ms   gradient blob 3 fades in (1200ms)
 *
 * Timing tokens in globals.css — tune independently:
 *   --gut-prompt-*        prompt center fade / pause / slide
 *   --gut-secondary-*     explanation / countdown
 *   --gut-blob-fade-*     gradient blobs (--gut-blob-after-countdown-delay = gap after countdown)
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  promptFadeDelay: 200,
  promptFade: 600,
  promptPause: 1000,
  promptSlide: 700,
  secondaryFade: 600,
  blobAfterCountdown: 600,
};

const PROMPT_SEQUENCE_MS =
  TIMING.promptFadeDelay +
  TIMING.promptFade +
  TIMING.promptPause +
  TIMING.promptSlide;

const COUNT_SECONDS = 30;
const CONTENT_MAX_WIDTH_PX = 600;
const PROMPT_MAX_WIDTH_PX = 720;
const PROMPT_TOP_PX = 160;
const GAP_AFTER_PROMPT_PX = 48;
const GAP_BEFORE_COUNTDOWN_PX = 64;
const GAP_BEFORE_INPUT_PX = 24;

/* ─────────────────────────────────────────────────────────
 * SURFACE LANGUAGE — two intentionally distinct materials
 *
 *   PROMPT_SURFACE  passive "brief"  → frosted, translucent, floats over blobs
 *   INPUT_SURFACE   active "form"    → crisp, solid, opaque card to write into
 *
 * Shared radius keeps them in one family; material does the differentiating.
 * ───────────────────────────────────────────────────────── */
const SURFACE_RADIUS = "calc(var(--radius-card) + 4px)";

const PROMPT_SURFACE: CSSProperties = {
  background: "rgba(255, 255, 255, 0.7)",
  border: "1px solid rgba(223, 226, 232, 0.4)",
  borderRadius: SURFACE_RADIUS,
  boxShadow:
    "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 16px 48px rgba(39, 37, 30, 0.08)",
  backdropFilter: "blur(24px) saturate(.9)",
  WebkitBackdropFilter: "blur(18px) saturate(1.08)",
};

const INPUT_SURFACE: CSSProperties = {
  background: "var(--color-paper-white)",
  border: "1px solid var(--color-hairline)",
  borderRadius: SURFACE_RADIUS,
  boxShadow: "var(--shadow-card)",
};

export function GutReaction() {
  const { state, setInitialStance, completeGutReaction } = useSession();
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [showSecondary, setShowSecondary] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const startedAt = useRef<number>(0);

  useEffect(() => {
    if (showSecondary) return;

    const id = window.setTimeout(() => setShowSecondary(true), PROMPT_SEQUENCE_MS);
    return () => window.clearTimeout(id);
  }, [showSecondary]);

  useEffect(() => {
    if (!showSecondary) return;

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
  }, [showSecondary]);

  const canContinue = done && state.initialStance.trim().length > 0;

  return (
    <div
      style={{
        height: "100%",
        position: "relative",
        background: "var(--color-parchment)",
        overflow: "hidden",
        "--gut-prompt-fade-delay": `${TIMING.promptFadeDelay}ms`,
        "--gut-prompt-fade-duration": `${TIMING.promptFade}ms`,
        "--gut-prompt-pause-duration": `${TIMING.promptPause}ms`,
        "--gut-prompt-slide-duration": `${TIMING.promptSlide}ms`,
        "--gut-prompt-top-offset": `${PROMPT_TOP_PX}px`,
        "--gut-secondary-fade-duration": `${TIMING.secondaryFade}ms`,
        "--gut-secondary-fade-delay": `${PROMPT_SEQUENCE_MS}ms`,
        "--gut-blob-after-countdown-delay": `${TIMING.blobAfterCountdown}ms`,
      } as CSSProperties}
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
            width: "calc(100% - 48px)",
            maxWidth: PROMPT_MAX_WIDTH_PX,
            boxSizing: "border-box",
          }}
        >
          <div
            className="gut-prompt-enter"
            style={{
              width: "100%",
            }}
          >
            <div
              style={{
                marginBottom: 12,
                color: "var(--color-dusk-gray)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-caption)",
                fontWeight: "var(--weight-medium)",
                letterSpacing: "0.03em",
                textAlign: "left",
              }}
            >
              Consider...
            </div>
            <div
              style={{
                ...PROMPT_SURFACE,
                width: "100%",
                padding: "28px 32px",
                boxSizing: "border-box",
                textAlign: "center",
                fontFamily: "var(--font-serif)",
                fontSize: "var(--text-h2)",
                lineHeight: 1.4,
                color: "var(--color-inkwell)",
              }}
            >
              {state.prompt}
            </div>
          </div>

          {showSecondary ? (
            <>
              <p
                className="gut-reaction-secondary-enter"
                style={{
                  width: "100%",
                  maxWidth: CONTENT_MAX_WIDTH_PX,
                  margin: `${GAP_AFTER_PROMPT_PX}px auto 0`,
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
                  marginLeft: "auto",
                  marginRight: "auto",
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
            </>
        ) : null}
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
      className="gut-countdown gut-reaction-secondary-enter"
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
      style={{
        fontSize: 22,
        fontWeight: "var(--weight-bold)",
        color: "var(--color-accent-countdown)",
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
        ...INPUT_SURFACE,
        padding: 16,
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
              : "var(--color-parchment-elevated)",
            color: canContinue
              ? "var(--color-paper-white)"
              : "var(--color-faded-stone)",
            border: canContinue
              ? "1px solid var(--color-graphite)"
              : "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-pill)",
            padding: "8px 18px",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-sm)",
            fontWeight: "var(--weight-medium)",
            cursor: canContinue ? "pointer" : "not-allowed",
            transition:
              "background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)",
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
