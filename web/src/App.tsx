import { useState } from "react";
import { SessionProvider } from "./state/SessionProvider";
import { Landing } from "./screens/Landing";
import { StudentSession } from "./screens/StudentSession";
import { TeacherDashboard } from "./screens/TeacherDashboard";

export type AppMode = "landing" | "student" | "teacher";

export function App() {
  const [mode, setMode] = useState<AppMode>("landing");

  return (
    <SessionProvider>
      {mode === "landing" && <Landing onPick={setMode} />}
      {mode === "student" && <StudentSession onExit={() => setMode("landing")} />}
      {mode === "teacher" && <TeacherDashboard onExit={() => setMode("landing")} />}
    </SessionProvider>
  );
}
