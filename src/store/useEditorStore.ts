import { create } from "zustand";

export type EditorElement = {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  text?: string;
  src?: string;
};

type EditorState = {
  elements: EditorElement[];
  selectedId: string | null;
  // canvas dimensions (in px)
  canvasWidth: number;
  canvasHeight: number;
  addElement: (el: Omit<EditorElement, "id">) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  selectElement: (id: string | null) => void;
  setAspectRatio: (ratio: "9:16" | "16:9") => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedId: null,
  // default to 16:9 used previously (800x450)
  canvasWidth: 800,
  canvasHeight: 450,
  addElement: (el) =>
    set((s) => ({
      elements: [...s.elements, { ...el, id: crypto.randomUUID() }],
    })),
  updateElement: (id, updates) =>
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  selectElement: (id) => set({ selectedId: id }),
  setAspectRatio: (ratio) =>
    set(() => {
      if (ratio === "9:16") {
        // portrait: swap and keep similar area to 800x450 -> use 450x800
        return { canvasWidth: 450, canvasHeight: 800 };
      }
      // 16:9 -> default
      return { canvasWidth: 800, canvasHeight: 450 };
    }),
}));
