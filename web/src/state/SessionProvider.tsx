import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SESSION_STORAGE_KEY, readStored, writeStored } from "../lib/storage";
import { uid } from "../lib/id";
import {
  createSeedSession,
  createSkipToCloseReadingSession,
  defaultCardLayout,
} from "./seed";
import type {
  AnnotationCard,
  CanvasGroup,
  CardStatus,
  EssayBlock,
  EssayBlockType,
  SessionState,
  TabKey,
} from "./types";
import type { PassageHighlight } from "../closeReading/highlightTypes";
import type { EssayComment } from "../lib/ai";

type Ctx = {
  state: SessionState;
  /* Gut reaction */
  setInitialStance: (value: string) => void;
  completeGutReaction: () => void;
  /* Highlights */
  addHighlight: (h: PassageHighlight) => void;
  updateHighlight: (id: string, patch: Partial<PassageHighlight>) => void;
  removeHighlight: (id: string) => void;
  /* Canvas cards */
  moveCard: (id: string, x: number, y: number) => void;
  setCardStatus: (id: string, status: CardStatus) => void;
  toggleCardMinimized: (id: string) => void;
  resetCanvas: () => void;
  /* Groups */
  addGroup: (group: Omit<CanvasGroup, "id">) => string;
  renameGroup: (id: string, label: string) => void;
  removeGroup: (id: string) => void;
  /* Connections */
  addConnection: (fromCardId: string, toCardId: string) => string;
  renameConnection: (id: string, label: string) => void;
  removeConnection: (id: string) => void;
  setCanvasSummary: (summary: string) => void;
  /* Thesis */
  setThesis: (value: string) => void;
  setThesisCritique: (value: string) => void;
  /* Essay structure */
  addSection: () => void;
  removeSection: (id: string) => void;
  renameSection: (id: string, label: string) => void;
  addBlock: (
    sectionId: string,
    type: EssayBlockType,
    options?: { content?: string; cardId?: string }
  ) => void;
  updateBlock: (
    sectionId: string,
    blockId: string,
    patch: Partial<EssayBlock>
  ) => void;
  removeBlock: (sectionId: string, blockId: string) => void;
  moveBlock: (params: {
    fromSectionId: string;
    blockId: string;
    toSectionId: string;
    toIndex: number;
  }) => void;
  setStructureFeedback: (value: string) => void;
  /* Essay writing */
  setEssayDraft: (value: string) => void;
  setEssayComments: (comments: EssayComment[]) => void;
  /* Tabs */
  openTab: (tab: TabKey) => void;
  closeTab: (tab: TabKey) => void;
  setActiveTab: (tab: TabKey) => void;
  /* Demo controls */
  resetSession: () => void;
  skipToCloseReading: () => void;
};

const SessionContext = createContext<Ctx | null>(null);

export function useSession(): Ctx {
  const c = useContext(SessionContext);
  if (!c) throw new Error("useSession must be used within SessionProvider");
  return c;
}

function loadInitial(): SessionState {
  if (window.location.search.includes("skip=close-reading")) {
    return createSkipToCloseReadingSession();
  }
  return readStored<SessionState>(SESSION_STORAGE_KEY, createSeedSession());
}

/**
 * Whenever the underlying highlights change, ensure each highlight has a
 * matching `AnnotationCard`. Cards persist their positions across reloads;
 * removing a highlight removes its card and any references in groups /
 * connections / essay blocks.
 */
function reconcileCards(state: SessionState): SessionState {
  const highlightIds = state.highlights.map((h) => h.id);
  const existingByHighlight = new Map(
    state.cards.map((c) => [c.highlightId, c])
  );

  const missingIds = highlightIds.filter((id) => !existingByHighlight.has(id));
  const newCardSpecs = defaultCardLayout(missingIds);
  // Stagger new card positions below existing ones to avoid overlap.
  const maxY = state.cards.reduce((m, c) => Math.max(m, c.y), 0);
  const offsetY = state.cards.length > 0 ? maxY + 260 : 0;
  const newCards: AnnotationCard[] = newCardSpecs.map((spec, i) => ({
    ...spec,
    y: spec.y + offsetY,
    highlightId: missingIds[i],
  }));

  const filteredExisting = state.cards.filter((c) =>
    highlightIds.includes(c.highlightId)
  );
  const allCards = [...filteredExisting, ...newCards];
  const allCardIds = new Set(allCards.map((c) => c.id));

  return {
    ...state,
    cards: allCards,
    groups: state.groups
      .map((g) => ({
        ...g,
        cardIds: g.cardIds.filter((id) => allCardIds.has(id)),
      }))
      .filter((g) => g.cardIds.length > 0),
    connections: state.connections.filter(
      (c) => allCardIds.has(c.fromCardId) && allCardIds.has(c.toCardId)
    ),
    essaySections: state.essaySections.map((sec) => ({
      ...sec,
      blocks: sec.blocks.filter(
        (b) => b.type !== "annotation-card" || (b.cardId && allCardIds.has(b.cardId))
      ),
    })),
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(loadInitial);

  useEffect(() => {
    writeStored(SESSION_STORAGE_KEY, state);
  }, [state]);

  /* ---------- Gut reaction ---------- */
  const setInitialStance = useCallback((value: string) => {
    setState((s) => ({ ...s, initialStance: value }));
  }, []);
  const completeGutReaction = useCallback(() => {
    setState((s) => ({
      ...s,
      gutReactionComplete: true,
      tabs: {
        ...s.tabs,
        openTabs: s.tabs.openTabs.includes("close-reading")
          ? s.tabs.openTabs
          : [...s.tabs.openTabs, "close-reading"],
        activeTab: "close-reading",
      },
    }));
  }, []);

  /* ---------- Highlights ---------- */
  const addHighlight = useCallback((h: PassageHighlight) => {
    setState((s) =>
      reconcileCards({ ...s, highlights: [...s.highlights, h] })
    );
  }, []);
  const updateHighlight = useCallback(
    (id: string, patch: Partial<PassageHighlight>) => {
      setState((s) => ({
        ...s,
        highlights: s.highlights.map((h) =>
          h.id === id ? { ...h, ...patch } : h
        ),
      }));
    },
    []
  );
  const removeHighlight = useCallback((id: string) => {
    setState((s) =>
      reconcileCards({
        ...s,
        highlights: s.highlights.filter((h) => h.id !== id),
      })
    );
  }, []);

  /* ---------- Canvas cards ---------- */
  const moveCard = useCallback((id: string, x: number, y: number) => {
    setState((s) => ({
      ...s,
      canvasDirty: true,
      cards: s.cards.map((c) => (c.id === id ? { ...c, x, y } : c)),
    }));
  }, []);
  const setCardStatus = useCallback((id: string, status: CardStatus) => {
    setState((s) => ({
      ...s,
      canvasDirty: true,
      cards: s.cards.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  }, []);
  const toggleCardMinimized = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) =>
        c.id === id ? { ...c, minimized: !c.minimized } : c
      ),
    }));
  }, []);

  const resetCanvas = useCallback(() => {
    setState((s) => {
      const highlightIds = s.highlights.map((h) => h.id);
      const layout = defaultCardLayout(highlightIds);
      const cards: AnnotationCard[] = layout.map((spec, i) => ({
        ...spec,
        highlightId: highlightIds[i],
      }));
      return {
        ...s,
        cards,
        groups: [],
        connections: [],
        canvasDirty: false,
      };
    });
  }, []);

  /* ---------- Groups ---------- */
  const addGroup = useCallback((group: Omit<CanvasGroup, "id">) => {
    const id = uid("grp");
    setState((s) => ({
      ...s,
      canvasDirty: true,
      groups: [...s.groups, { ...group, id }],
    }));
    return id;
  }, []);
  const renameGroup = useCallback((id: string, label: string) => {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) => (g.id === id ? { ...g, label } : g)),
    }));
  }, []);
  const removeGroup = useCallback((id: string) => {
    setState((s) => ({ ...s, groups: s.groups.filter((g) => g.id !== id) }));
  }, []);

  /* ---------- Connections ---------- */
  const addConnection = useCallback(
    (fromCardId: string, toCardId: string) => {
      const id = uid("conn");
      setState((s) => ({
        ...s,
        canvasDirty: true,
        connections: [
          ...s.connections,
          { id, fromCardId, toCardId, label: "" },
        ],
      }));
      return id;
    },
    []
  );
  const renameConnection = useCallback((id: string, label: string) => {
    setState((s) => ({
      ...s,
      connections: s.connections.map((c) =>
        c.id === id ? { ...c, label } : c
      ),
    }));
  }, []);
  const removeConnection = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      connections: s.connections.filter((c) => c.id !== id),
    }));
  }, []);

  const setCanvasSummary = useCallback((summary: string) => {
    setState((s) => ({ ...s, canvasSummary: summary }));
  }, []);

  /* ---------- Thesis ---------- */
  const setThesis = useCallback((value: string) => {
    setState((s) => ({ ...s, thesis: value }));
  }, []);
  const setThesisCritique = useCallback((value: string) => {
    setState((s) => ({ ...s, thesisCritique: value }));
  }, []);

  /* ---------- Essay structure ---------- */
  const addSection = useCallback(() => {
    setState((s) => ({
      ...s,
      essaySections: [
        ...s.essaySections,
        { id: uid("sec"), label: `BP${s.essaySections.length - 1}`, blocks: [] },
      ],
    }));
  }, []);
  const removeSection = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      essaySections: s.essaySections.filter((sec) => sec.id !== id),
    }));
  }, []);
  const renameSection = useCallback((id: string, label: string) => {
    setState((s) => ({
      ...s,
      essaySections: s.essaySections.map((sec) =>
        sec.id === id ? { ...sec, label } : sec
      ),
    }));
  }, []);
  const addBlock = useCallback<Ctx["addBlock"]>(
    (sectionId, type, options) => {
      setState((s) => {
        const block: EssayBlock = {
          id: uid("blk"),
          type,
          content: options?.content ?? "",
          cardId: options?.cardId,
        };
        return {
          ...s,
          essaySections: s.essaySections.map((sec) =>
            sec.id === sectionId
              ? { ...sec, blocks: [...sec.blocks, block] }
              : sec
          ),
        };
      });
    },
    []
  );
  const updateBlock = useCallback<Ctx["updateBlock"]>(
    (sectionId, blockId, patch) => {
      setState((s) => ({
        ...s,
        essaySections: s.essaySections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                blocks: sec.blocks.map((b) =>
                  b.id === blockId ? { ...b, ...patch } : b
                ),
              }
            : sec
        ),
      }));
    },
    []
  );
  const removeBlock = useCallback((sectionId: string, blockId: string) => {
    setState((s) => ({
      ...s,
      essaySections: s.essaySections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, blocks: sec.blocks.filter((b) => b.id !== blockId) }
          : sec
      ),
    }));
  }, []);
  const moveBlock = useCallback<Ctx["moveBlock"]>(
    ({ fromSectionId, blockId, toSectionId, toIndex }) => {
      setState((s) => {
        const fromSec = s.essaySections.find((sec) => sec.id === fromSectionId);
        if (!fromSec) return s;
        const block = fromSec.blocks.find((b) => b.id === blockId);
        if (!block) return s;

        return {
          ...s,
          essaySections: s.essaySections.map((sec) => {
            if (sec.id === fromSectionId && sec.id === toSectionId) {
              const without = sec.blocks.filter((b) => b.id !== blockId);
              const target = Math.min(
                Math.max(0, toIndex),
                without.length
              );
              const next = [...without];
              next.splice(target, 0, block);
              return { ...sec, blocks: next };
            }
            if (sec.id === fromSectionId) {
              return {
                ...sec,
                blocks: sec.blocks.filter((b) => b.id !== blockId),
              };
            }
            if (sec.id === toSectionId) {
              const next = [...sec.blocks];
              const target = Math.min(Math.max(0, toIndex), next.length);
              next.splice(target, 0, block);
              return { ...sec, blocks: next };
            }
            return sec;
          }),
        };
      });
    },
    []
  );
  const setStructureFeedback = useCallback((value: string) => {
    setState((s) => ({ ...s, structureFeedback: value }));
  }, []);

  /* ---------- Essay writing ---------- */
  const setEssayDraft = useCallback((value: string) => {
    setState((s) => ({ ...s, essayDraft: value }));
  }, []);
  const setEssayComments = useCallback((comments: EssayComment[]) => {
    setState((s) => ({ ...s, essayComments: comments }));
  }, []);

  /* ---------- Tabs ---------- */
  const openTab = useCallback((tab: TabKey) => {
    setState((s) => {
      const openTabs = s.tabs.openTabs.includes(tab)
        ? s.tabs.openTabs
        : [...s.tabs.openTabs, tab];
      return { ...s, tabs: { openTabs, activeTab: tab } };
    });
  }, []);
  const closeTab = useCallback((tab: TabKey) => {
    setState((s) => {
      const remaining = s.tabs.openTabs.filter((t) => t !== tab);
      if (remaining.length === 0) return s;
      const activeTab = s.tabs.activeTab === tab ? remaining[remaining.length - 1] : s.tabs.activeTab;
      return { ...s, tabs: { openTabs: remaining, activeTab } };
    });
  }, []);
  const setActiveTab = useCallback((tab: TabKey) => {
    setState((s) => {
      if (!s.tabs.openTabs.includes(tab)) return s;
      return { ...s, tabs: { ...s.tabs, activeTab: tab } };
    });
  }, []);

  /* ---------- Reset ---------- */
  /** Wipe everything; the student lands back at Gut Reaction. */
  const resetSession = useCallback(() => {
    setState(createSeedSession());
  }, []);
  /** Wipe Canvas / Thesis / Structure / Draft, but jump past Gut Reaction
   *  with a pre-filled stance and pre-seeded highlights. */
  const skipToCloseReading = useCallback(() => {
    setState(createSkipToCloseReadingSession());
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      setInitialStance,
      completeGutReaction,
      addHighlight,
      updateHighlight,
      removeHighlight,
      moveCard,
      setCardStatus,
      toggleCardMinimized,
      resetCanvas,
      addGroup,
      renameGroup,
      removeGroup,
      addConnection,
      renameConnection,
      removeConnection,
      setCanvasSummary,
      setThesis,
      setThesisCritique,
      addSection,
      removeSection,
      renameSection,
      addBlock,
      updateBlock,
      removeBlock,
      moveBlock,
      setStructureFeedback,
      setEssayDraft,
      setEssayComments,
      openTab,
      closeTab,
      setActiveTab,
      resetSession,
      skipToCloseReading,
    }),
    [
      state,
      setInitialStance,
      completeGutReaction,
      addHighlight,
      updateHighlight,
      removeHighlight,
      moveCard,
      setCardStatus,
      toggleCardMinimized,
      resetCanvas,
      addGroup,
      renameGroup,
      removeGroup,
      addConnection,
      renameConnection,
      removeConnection,
      setCanvasSummary,
      setThesis,
      setThesisCritique,
      addSection,
      removeSection,
      renameSection,
      addBlock,
      updateBlock,
      removeBlock,
      moveBlock,
      setStructureFeedback,
      setEssayDraft,
      setEssayComments,
      openTab,
      closeTab,
      setActiveTab,
      resetSession,
      skipToCloseReading,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
