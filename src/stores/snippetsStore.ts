import { create } from "zustand";
import { commands, type Snippet } from "@/bindings";

interface SnippetsState {
  snippets: Snippet[];
  loading: boolean;
  error: string | null;
  fetchSnippets: () => Promise<void>;
  createSnippet: (trigger: string, expansion: string) => Promise<Snippet>;
  updateSnippet: (
    id: number,
    trigger: string,
    expansion: string,
    isEnabled: boolean,
  ) => Promise<Snippet>;
  deleteSnippet: (id: number) => Promise<void>;
}

export const useSnippetsStore = create<SnippetsState>((set) => ({
  snippets: [],
  loading: false,
  error: null,

  fetchSnippets: async () => {
    set({ loading: true, error: null });
    try {
      const result = await commands.listSnippets();
      if (result.status === "ok") {
        set({ snippets: result.data, loading: false });
      } else {
        set({ error: String(result.error), loading: false });
      }
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  createSnippet: async (trigger, expansion) => {
    const result = await commands.createSnippet(trigger, expansion);
    if (result.status === "ok") {
      set((state) => ({
        snippets: [result.data, ...state.snippets],
        error: null,
      }));
      return result.data;
    }
    const errorMessage = String(result.error);
    set({ error: errorMessage });
    throw new Error(errorMessage);
  },

  updateSnippet: async (id, trigger, expansion, isEnabled) => {
    const result = await commands.updateSnippet(
      id,
      trigger,
      expansion,
      isEnabled,
    );
    if (result.status === "ok") {
      set((state) => ({
        snippets: state.snippets.map((s) => (s.id === id ? result.data : s)),
        error: null,
      }));
      return result.data;
    }
    const errorMessage = String(result.error);
    set({ error: errorMessage });
    throw new Error(errorMessage);
  },

  deleteSnippet: async (id) => {
    const result = await commands.deleteSnippet(id);
    if (result.status === "ok") {
      set((state) => ({
        snippets: state.snippets.filter((s) => s.id !== id),
        error: null,
      }));
      return;
    }
    const errorMessage = String(result.error);
    set({ error: errorMessage });
    throw new Error(errorMessage);
  },
}));