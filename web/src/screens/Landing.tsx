import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Logo } from "../components/Logo";
import type { AppMode } from "../App";
import { aiMode } from "../lib/ai";

type Props = {
  onPick: (mode: AppMode) => void;
};

export function Landing({ onPick }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-paper-white)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          height: 56,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        <Logo />
        <span
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--color-faded-stone)",
          }}
        >
          AI mode: {aiMode === "live" ? "live" : "scripted demo"}
        </span>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 720, width: "100%", textAlign: "center" }}>
          <div
            style={{
              fontSize: "var(--text-caption)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--color-faded-stone)",
              marginBottom: 12,
            }}
          >
            Structured thinking for writing
          </div>
          <h1
            style={{
              fontSize: 40,
              fontWeight: "var(--weight-medium)",
              letterSpacing: "-0.01em",
              margin: 0,
              marginBottom: 16,
            }}
          >
            A canvas for the work behind the essay.
          </h1>
          <p
            style={{
              maxWidth: 540,
              margin: "0 auto 40px",
              color: "var(--color-dusk-gray)",
              fontSize: "var(--text-body)",
              lineHeight: 1.6,
            }}
          >
            Tabula guides students through close reading, evidence
            organization, and argument construction — with AI that pushes
            their thinking rather than replacing it.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            <Card padding={20} style={{ textAlign: "left" }}>
              <div
                style={{
                  fontSize: "var(--text-caption)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--color-faded-stone)",
                  marginBottom: 8,
                }}
              >
                Student
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: "var(--weight-medium)",
                  marginBottom: 6,
                }}
              >
                Enter the session
              </div>
              <p
                style={{
                  color: "var(--color-dusk-gray)",
                  fontSize: "var(--text-body-sm)",
                  margin: 0,
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                Begin with a 30-second gut reaction, then move through the
                close reading, canvas, thesis, structure, and final draft.
              </p>
              <Button
                variant="primary"
                onClick={() => onPick("student")}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Open student session →
              </Button>
            </Card>

            <Card padding={20} style={{ textAlign: "left" }}>
              <div
                style={{
                  fontSize: "var(--text-caption)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--color-faded-stone)",
                  marginBottom: 8,
                }}
              >
                Teacher
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: "var(--weight-medium)",
                  marginBottom: 6,
                }}
              >
                Classroom dashboard
              </div>
              <p
                style={{
                  color: "var(--color-dusk-gray)",
                  fontSize: "var(--text-body-sm)",
                  margin: 0,
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                Preview the static dashboard: classes, assignments, and
                student submission status.
              </p>
              <Button
                variant="outline"
                onClick={() => onPick("teacher")}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Open dashboard →
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
