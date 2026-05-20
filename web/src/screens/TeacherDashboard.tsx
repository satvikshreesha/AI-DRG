import { useState } from "react";
import { Logo } from "../components/Logo";

type Student = {
  id: string;
  name: string;
  status: "submitted" | "in-progress" | "not-started";
  lastActivity: string;
};

type Assignment = {
  id: string;
  title: string;
  text: string;
  dueDate: string;
  submitted: number;
  total: number;
  students: Student[];
};

type Klass = {
  id: string;
  name: string;
  period: string;
  studentCount: number;
  assignments: Assignment[];
};

const CLASSES: Klass[] = [
  {
    id: "k1",
    name: "AP Literature & Composition",
    period: "Period 3",
    studentCount: 24,
    assignments: [
      {
        id: "a1",
        title: "Poe — Mortality & Performance",
        text: "The Masque of the Red Death",
        dueDate: "Mar 18",
        submitted: 14,
        total: 24,
        students: [
          {
            id: "s1",
            name: "Amelia Tran",
            status: "submitted",
            lastActivity: "Mar 18, 2:14 PM",
          },
          {
            id: "s2",
            name: "Jordan Park",
            status: "submitted",
            lastActivity: "Mar 18, 1:58 PM",
          },
          {
            id: "s3",
            name: "Maya Okafor",
            status: "in-progress",
            lastActivity: "Mar 18, 1:42 PM",
          },
          {
            id: "s4",
            name: "Daniel Cohen",
            status: "submitted",
            lastActivity: "Mar 18, 1:39 PM",
          },
          {
            id: "s5",
            name: "Priya Iyer",
            status: "in-progress",
            lastActivity: "Mar 18, 1:30 PM",
          },
          {
            id: "s6",
            name: "Lukas Becker",
            status: "not-started",
            lastActivity: "—",
          },
        ],
      },
      {
        id: "a2",
        title: "Fitzgerald — The Cost of the Dream",
        text: "The Great Gatsby, Ch. 1–3",
        dueDate: "Apr 02",
        submitted: 0,
        total: 24,
        students: [],
      },
    ],
  },
  {
    id: "k2",
    name: "AP Literature & Composition",
    period: "Period 5",
    studentCount: 22,
    assignments: [
      {
        id: "a3",
        title: "Hawthorne — Public Shame",
        text: "The Scarlet Letter, Ch. 1–4",
        dueDate: "Mar 22",
        submitted: 8,
        total: 22,
        students: [],
      },
    ],
  },
];

type Props = {
  onExit: () => void;
};

export function TeacherDashboard({ onExit }: Props) {
  const [activeClassId, setActiveClassId] = useState(CLASSES[0].id);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    CLASSES[0].assignments[0]?.id ?? null
  );

  const activeClass = CLASSES.find((k) => k.id === activeClassId)!;
  const activeAssignment =
    activeClass.assignments.find((a) => a.id === activeAssignmentId) ?? null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-paper-white)",
      }}
    >
      <header
        style={{
          height: 56,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo />
          <span style={{ color: "var(--color-hairline)" }}>·</span>
          <span
            style={{
              fontSize: "var(--text-body-sm)",
              color: "var(--color-dusk-gray)",
            }}
          >
            Teacher dashboard
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-faded-stone)",
            fontSize: "var(--text-caption)",
            cursor: "pointer",
            padding: "4px 10px",
            borderRadius: 6,
          }}
        >
          Exit
        </button>
      </header>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "240px 320px 1fr",
          minHeight: 0,
        }}
      >
        <aside
          style={{
            borderRight: "1px solid var(--color-hairline)",
            padding: 16,
            background: "var(--color-parchment)",
          }}
        >
          <SidebarHeader label="Classes" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {CLASSES.map((k) => {
              const isActive = k.id === activeClassId;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    setActiveClassId(k.id);
                    setActiveAssignmentId(k.assignments[0]?.id ?? null);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    background: isActive
                      ? "var(--color-paper-white)"
                      : "transparent",
                    border: "1px solid",
                    borderColor: isActive
                      ? "var(--color-hairline)"
                      : "transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "var(--text-body-sm)",
                    color: "var(--color-inkwell)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <span style={{ fontWeight: "var(--weight-medium)" }}>
                    {k.name}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-caption)",
                      color: "var(--color-dusk-gray)",
                    }}
                  >
                    {k.period} · {k.studentCount} students
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 24 }}>
            <SidebarHeader label="Library" />
            {["Prompts", "Texts", "Rubrics"].map((label) => (
              <button
                key={label}
                type="button"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid transparent",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "var(--text-body-sm)",
                  color: "var(--color-dusk-gray)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </aside>

        <section
          style={{
            borderRight: "1px solid var(--color-hairline)",
            padding: 24,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: "var(--weight-medium)",
                margin: 0,
              }}
            >
              Assignments
            </h2>
            <button
              type="button"
              style={{
                background: "var(--color-graphite)",
                color: "var(--color-paper-white)",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "5px 12px",
                fontSize: "var(--text-caption)",
                cursor: "pointer",
              }}
            >
              + New
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeClass.assignments.map((a) => {
              const isActive = a.id === activeAssignmentId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveAssignmentId(a.id)}
                  style={{
                    textAlign: "left",
                    background: isActive
                      ? "var(--color-parchment)"
                      : "var(--color-paper-white)",
                    border: "1px solid var(--color-hairline)",
                    borderRadius: 12,
                    padding: 14,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-body-sm)",
                      fontWeight: "var(--weight-medium)",
                    }}
                  >
                    {a.title}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-caption)",
                      color: "var(--color-dusk-gray)",
                    }}
                  >
                    {a.text} · Due {a.dueDate}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <ProgressBar value={a.submitted} max={a.total} />
                    <span
                      style={{
                        fontSize: "var(--text-caption)",
                        color: "var(--color-dusk-gray)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.submitted}/{a.total} submitted
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ padding: 32, overflowY: "auto" }}>
          {activeAssignment ? (
            <AssignmentDetail assignment={activeAssignment} />
          ) : (
            <div style={{ color: "var(--color-dusk-gray)" }}>
              Select an assignment to view submissions.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SidebarHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: "var(--text-caption)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-faded-stone)",
        margin: "4px 12px 8px",
      }}
    >
      {label}
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.max(2, (value / max) * 100);
  return (
    <div
      style={{
        flex: 1,
        height: 4,
        background: "var(--color-hairline)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "var(--color-graphite)",
          borderRadius: 999,
          transition: "width 250ms ease-out",
        }}
      />
    </div>
  );
}

function AssignmentDetail({ assignment }: { assignment: Assignment }) {
  return (
    <div>
      <div
        style={{
          fontSize: "var(--text-caption)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-faded-stone)",
          marginBottom: 8,
        }}
      >
        Assignment
      </div>
      <h1
        style={{
          fontSize: 26,
          fontWeight: "var(--weight-medium)",
          margin: 0,
          marginBottom: 8,
          letterSpacing: "-0.005em",
        }}
      >
        {assignment.title}
      </h1>
      <div
        style={{
          color: "var(--color-dusk-gray)",
          fontSize: "var(--text-body-sm)",
          marginBottom: 24,
        }}
      >
        {assignment.text} · Due {assignment.dueDate}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <Stat label="Submitted" value={`${assignment.submitted}`} />
        <Stat label="In progress" value={`${assignment.students.filter((s) => s.status === "in-progress").length}`} />
        <Stat label="Not started" value={`${Math.max(0, assignment.total - assignment.submitted - assignment.students.filter((s) => s.status === "in-progress").length)}`} />
      </div>

      <div
        style={{
          fontSize: "var(--text-body-sm)",
          fontWeight: "var(--weight-medium)",
          marginBottom: 10,
        }}
      >
        Students
      </div>
      <div
        style={{
          border: "1px solid var(--color-hairline)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {assignment.students.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--color-faded-stone)",
              fontSize: "var(--text-body-sm)",
            }}
          >
            No student activity yet.
          </div>
        ) : (
          assignment.students.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 12,
                padding: "10px 14px",
                alignItems: "center",
                borderBottom:
                  i === assignment.students.length - 1
                    ? "none"
                    : "1px solid var(--color-hairline)",
                background:
                  i % 2 === 0
                    ? "var(--color-paper-white)"
                    : "var(--color-parchment)",
              }}
            >
              <div style={{ fontSize: "var(--text-body-sm)" }}>{s.name}</div>
              <StatusPill status={s.status} />
              <div
                style={{
                  fontSize: "var(--text-caption)",
                  color: "var(--color-dusk-gray)",
                  whiteSpace: "nowrap",
                }}
              >
                {s.lastActivity}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-hairline)",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: "var(--text-caption)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-faded-stone)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: "var(--weight-medium)" }}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Student["status"] }) {
  const config = {
    submitted: { label: "Submitted", color: "#5a7c5a" },
    "in-progress": { label: "In progress", color: "#8a6b3a" },
    "not-started": { label: "Not started", color: "#8a8a82" },
  }[status];
  return (
    <span
      style={{
        fontSize: "var(--text-caption)",
        color: config.color,
        border: `1px solid ${config.color}33`,
        background: `${config.color}11`,
        padding: "2px 10px",
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}
