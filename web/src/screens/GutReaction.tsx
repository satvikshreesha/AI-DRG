import { useEffect, useRef, useState } from "react";
import { useSession } from "../state/SessionProvider";

const COUNT_SECONDS = 30;

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
        minHeight: "100vh",
        position: "relative",
        background: "var(--color-paper-white)",
        overflow: "hidden",
      }}
    >
      <SoftGradient phase={done ? "settled" : "thinking"} />

      <div
        style={{
          position: "relative",
          maxWidth: 720,
          margin: "0 auto",
          padding: "80px 24px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          minHeight: "100vh",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <div
          style={{
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-card)",
            padding: "26px 34px",
            background: "var(--color-paper-white)",
            maxWidth: 600,
            textAlign: "center",
            fontSize: 17,
            lineHeight: 1.6,
            color: "var(--color-inkwell)",
            animation: "fadeIn 600ms ease-out",
          }}
        >
          {state.prompt}
        </div>

        <div
          style={{
            color: "var(--color-dusk-gray)",
            fontSize: "var(--text-body-sm)",
            textAlign: "center",
            animation: "fadeIn 600ms ease-out",
            animationDelay: "200ms",
            animationFillMode: "backwards",
          }}
        >
          {done
            ? "Respond to the prompt, nothing fancy, just your initial position after thinking."
            : "Take thirty seconds to think about your stance on this prompt."}
        </div>

        {!done ? (
          <CountUpRing elapsed={elapsed} total={COUNT_SECONDS} />
        ) : (
          <div style={{ width: "100%", maxWidth: 600, animation: "fadeInUp 420ms ease-out" }}>
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
  );
}

function SoftGradient({ phase }: { phase: "thinking" | "settled" }) {
  const intensity = phase === "thinking" ? 0.9 : 0.55;
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(214,224,236,0.7), transparent 65%)",
          top: "-15%",
          left: "10%",
          opacity: intensity,
          filter: "blur(40px)",
          animation: "gutPulse 7s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(230,221,236,0.65), transparent 65%)",
          top: "30%",
          right: "5%",
          opacity: intensity,
          filter: "blur(40px)",
          animation: "gutPulse 9s ease-in-out infinite",
          animationDelay: "1.4s",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,228,214,0.65), transparent 65%)",
          bottom: "-10%",
          left: "32%",
          opacity: intensity,
          filter: "blur(40px)",
          animation: "gutPulse 11s ease-in-out infinite",
          animationDelay: "0.6s",
        }}
      />
    </div>
  );
}

function CountUpRing({ elapsed, total }: { elapsed: number; total: number }) {
  const size = 132;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = elapsed / total;
  const dash = circumference * progress;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-hairline)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#2c4373"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 250ms linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          fontSize: 36,
          fontWeight: "var(--weight-medium)",
          color: "var(--color-inkwell)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {elapsed}
      </div>
    </div>
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
