import { create } from "zustand";

export type EditorElement = {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  src?: string;
};

type EditorState = {
  elements: EditorElement[];
  selectedId: string | null;
  addElement: (el: Omit<EditorElement, "id">) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  selectElement: (id: string | null) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedId: null,
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
}));
