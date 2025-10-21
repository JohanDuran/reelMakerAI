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
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fillColor?: string;
  align?: 'left' | 'center' | 'right';
  text?: string;
  src?: string;
  fileName?: string;
  aiText?: string;
  aiImage?: string;
};

type EditorState = {
  elements: EditorElement[];
  selectedId: string | null;
  // canvas dimensions (in px)
  canvasWidth: number;
  canvasHeight: number;
  // canvas-level properties
  canvasBackground?: string | null; // data URL or remote URL
  canvasBackgroundFile?: File | null; // original File object for uploaded background (cleared on remove)
  canvasBackgroundRepeat?: boolean;
  canvasMeta?: string; // arbitrary text to send to backend
  showCanvaProperties: boolean;
  addElement: (el: Omit<EditorElement, "id">) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  removeElement: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  setCanvasBackground: (src: string | null) => void;
  setCanvasBackgroundFile: (f: File | null) => void;
  setCanvasBackgroundRepeat: (v: boolean) => void;
  setCanvasMeta: (text: string) => void;
  setShowCanvaProperties: (v: boolean) => void;
  selectElement: (id: string | null) => void;
  setAspectRatio: (ratio: "9:16" | "16:9") => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedId: null,
  // default to 9:16 (portrait) as the new default aspect ratio (450x800)
  canvasWidth: 450,
  canvasHeight: 800,
  canvasBackground: null,
  canvasBackgroundFile: null,
  canvasBackgroundRepeat: false,
  canvasMeta: '',
  showCanvaProperties: false,
  addElement: (el) =>
    set((s) => {
      // ensure rectangles have a text field (empty by default)
      const newEl = { ...el, id: crypto.randomUUID(), ...(el.type === 'rectangle' ? { text: el.text ?? '' } : {}) };
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
  // move the element one step forward in the stacking order (towards end of array)
  bringForward: (id: string) =>
    set((s) => {
      const idx = s.elements.findIndex((e) => e.id === id);
      if (idx === -1 || idx >= s.elements.length - 1) return {} as any;
      const arr = s.elements.slice();
      const tmp = arr[idx + 1];
      arr[idx + 1] = arr[idx];
      arr[idx] = tmp;
      return { elements: arr } as any;
    }),
  // move the element one step backward in the stacking order (towards start of array)
  sendBackward: (id: string) =>
    set((s) => {
      const idx = s.elements.findIndex((e) => e.id === id);
      if (idx <= 0) return {} as any;
      const arr = s.elements.slice();
      const tmp = arr[idx - 1];
      arr[idx - 1] = arr[idx];
      arr[idx] = tmp;
      // if we moved the selected element backward, selection remains
      return { elements: arr } as any;
    }),
  selectElement: (id) => set({ selectedId: id }),
  setCanvasBackground: (src) => set(() => ({ canvasBackground: src })),
  setCanvasBackgroundFile: (f) => set(() => ({ canvasBackgroundFile: f })),
  setCanvasBackgroundRepeat: (v) => set(() => ({ canvasBackgroundRepeat: v })),
  setCanvasMeta: (text) => set(() => ({ canvasMeta: text })),
  setShowCanvaProperties: (v: boolean) => set({ showCanvaProperties: v }),
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
