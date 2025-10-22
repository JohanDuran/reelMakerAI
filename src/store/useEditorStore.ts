import { create } from "zustand";

export type EditorElement = {
  id: string;
  type: "text" | "image" | "rectangle" | "aiImage";
  x: number;
  y: number;
  groupId?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
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
  // for `aiImage` elements — text prompt used to generate the image
  aiImagePrompt?: string;
};

export type EditorGroup = {
  id: string;
  name?: string;
  aiTopic?: string;
  // TTS and timing fields for Multiple Option template
  ttsMode?: 'question_and_answer' | 'question_only' | 'question_options_and_answer' | 'question_and_correct_answer_only';
  clipDuration?: number; // seconds
  ttsQuestionDuration?: boolean;
  answerDuration?: number; // seconds
  ttsAnswerDuration?: boolean;
};

type EditorState = {
  elements: EditorElement[];
  selectedId: string | null;
  selectedGroupId?: string | null;
  // canvas dimensions (in px)
  canvasWidth: number;
  canvasHeight: number;
  // canvas-level properties
  canvasBackground?: string | null; // data URL or remote URL
  canvasBackgroundFile?: File | null; // original File object for uploaded background (cleared on remove)
  canvasBackgroundRepeat?: boolean;
  canvasMeta?: string; // arbitrary text to send to backend
  showCanvaProperties: boolean;
  groups: Record<string, EditorGroup>;
  addElement: (el: Omit<EditorElement, "id">) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  removeElement: (id: string) => void;
  addGroup: (g: Omit<EditorGroup, 'id'> & { id?: string }) => string;
  updateGroup: (id: string, updates: Partial<EditorGroup>) => void;
  removeGroup: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  setCanvasBackground: (src: string | null) => void;
  setCanvasBackgroundFile: (f: File | null) => void;
  setCanvasBackgroundRepeat: (v: boolean) => void;
  setCanvasMeta: (text: string) => void;
  setShowCanvaProperties: (v: boolean) => void;
  selectGroup: (id: string | null) => void;
  selectElement: (id: string | null) => void;
  setAspectRatio: (ratio: "9:16" | "16:9") => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedId: null,
  selectedGroupId: null,
  // default to 9:16 (portrait) as the new default aspect ratio (450x800)
  canvasWidth: 450,
  canvasHeight: 800,
  canvasBackground: null,
  canvasBackgroundFile: null,
  canvasBackgroundRepeat: false,
  canvasMeta: '',
  showCanvaProperties: false,
  groups: {},
  addElement: (el) =>
    set((s) => {
      // ensure rectangles have a text field (empty by default) and a cornerRadius default
      const rectDefaults: Partial<EditorElement> = el.type === 'rectangle' ? { text: el.text ?? '', cornerRadius: (el as any).cornerRadius ?? 0 } : {};
      const aiImageDefaults: Partial<EditorElement> = el.type === 'aiImage' ? { text: el.text ?? '', aiImagePrompt: (el as any).aiImagePrompt ?? '' } : {};
      const defaults: Partial<EditorElement> = { ...rectDefaults, ...aiImageDefaults };
      const newEl = { ...el, id: crypto.randomUUID(), ...defaults } as EditorElement;
      return { elements: [...s.elements, newEl], selectedId: newEl.id };
    }),
  addGroup: (g) => {
    const id = g.id ?? crypto.randomUUID();
    const group: EditorGroup = { id, name: g.name, aiTopic: g.aiTopic, ttsMode: (g as any).ttsMode, clipDuration: (g as any).clipDuration, ttsQuestionDuration: (g as any).ttsQuestionDuration, answerDuration: (g as any).answerDuration, ttsAnswerDuration: (g as any).ttsAnswerDuration };
    set((s) => ({ groups: { ...s.groups, [id]: group } } as any));
    return id;
  },
  removeGroup: (id: string) =>
    set((s) => {
      // remove group entry and any elements that belong to it
      const { [id]: _removed, ...rest } = s.groups;
      const remaining = s.elements.filter((e) => e.groupId !== id);
      return { groups: rest, elements: remaining, selectedGroupId: s.selectedGroupId === id ? null : s.selectedGroupId, selectedId: s.selectedId && s.elements.find((el) => el.id === s.selectedId && el.groupId === id) ? null : s.selectedId } as any;
    }),
  updateGroup: (id, updates) => set((s) => ({ groups: { ...s.groups, [id]: { ...s.groups[id], ...updates } } })),
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
  // When selecting an element, show element properties (hide canvas-level properties)
  selectElement: (id) => set(() => ({ selectedId: id, selectedGroupId: null, showCanvaProperties: false })),
  // Select a group to show group-level properties (hide element and canvas properties)
  selectGroup: (id) => set(() => ({ selectedGroupId: id, selectedId: null, showCanvaProperties: false })),
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
