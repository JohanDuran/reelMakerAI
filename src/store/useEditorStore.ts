import { create } from "zustand";

export type EditorElement = {
  id: string;
  type: "text" | "image" | "rectangle";
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontColor?: string;
  fillColor?: string;
  align?: 'left' | 'center' | 'right';
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
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setAspectRatio: (ratio: "9:16" | "16:9") => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedId: null,
  // default to 9:16 (portrait) as the new default aspect ratio (450x800)
  canvasWidth: 450,
  canvasHeight: 800,
  addElement: (el) =>
    set((s) => {
      const newEl = { ...el, id: crypto.randomUUID() };
      return { elements: [...s.elements, newEl], selectedId: newEl.id };
    }),
  updateElement: (id, updates) =>
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((e) => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
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
