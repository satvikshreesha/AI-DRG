import { useSession } from "../state/SessionProvider";
import { TabBar, TAB_BAR_HEIGHT } from "../components/TabBar";
import { StancePill } from "../components/StancePill";
import { GutReaction } from "./GutReaction";
import { CloseReading } from "../closeReading/CloseReading";
import { InterpretationCanvas } from "../interpretation/InterpretationCanvas";
import { ThesisFormation } from "../thesis/ThesisFormation";
import { EssayStructure } from "../structure/EssayStructure";
import { EssayWriting } from "../writing/EssayWriting";

type Props = {
  onExit: () => void;
};

export function StudentSession({ onExit }: Props) {
  const { state } = useSession();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-paper-white)",
        overflow: "hidden",
      }}
    >
      <TabBar onExit={onExit} />
      <main
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          paddingTop: TAB_BAR_HEIGHT,
          background: "var(--color-paper-white)",
          overflow: "hidden",
        }}
      >
        {!state.gutReactionComplete ? (
          <GutReaction />
        ) : (
          <>
            {state.tabs.activeTab === "close-reading" && <CloseReading />}
            {state.tabs.activeTab === "interpretation" && (
              <InterpretationCanvas />
            )}
            {state.tabs.activeTab === "thesis" && <ThesisFormation />}
            {state.tabs.activeTab === "structure" && <EssayStructure />}
            {state.tabs.activeTab === "writing" && <EssayWriting />}
            <StancePill />
          </>
        )}
      </main>
    </div>
  );
}
