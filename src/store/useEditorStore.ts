import { create } from "zustand";

export type EditorElement = {
  id: string;
  type: "text" | "image" | "rectangle" | "aiImage";
  x: number;
  y: number;
  // optional semantic subtype used for templates/groups (e.g. 'question' | 'option')
  subtype?: string;
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
  // stacking order (0 = bottom). Managed by the store; serialized on export.
  zIndex?: number;
};

export type EditorGroup = {
  id: string;
  name?: string;
  aiTopic?: string;
  // TTS and timing fields for Multiple Option template
  ttsMode?: 'None' | 'question_and_answer' | 'question_only' | 'question_options_and_answer' | 'question_and_correct_answer_only';
  clipDuration?: number; // seconds
  ttsQuestionDuration?: boolean;
  answerDuration?: number; // seconds
  ttsAnswerDuration?: boolean;
  // initial zIndex assigned to elements created for this group (set when group is created)
  initialZ?: number;
};

export type EditorCanvas = {
  id: string;
  width: number;
  height: number;
  background?: string | null;
  backgroundRepeat?: boolean;
  canvasMeta?: string;
  canvasTtsModel?: string | undefined;
  elements: EditorElement[];
  groups: Record<string, EditorGroup>;
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
  canvasTtsModel?: string; // selected TTS model for the canvas
  // multi-canvas support
  canvases?: EditorCanvas[];
  currentCanvasId?: string | null;
  showCanvaProperties: boolean;
  groups: Record<string, EditorGroup>;
  addElement: (el: Omit<EditorElement, "id">) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  removeElement: (id: string) => void;
  addGroup: (g: Omit<EditorGroup, 'id'> & { id?: string }) => string;
  newCanvas: (opts?: Partial<EditorCanvas>) => string;
  switchCanvas: (id: string) => void;
  deleteCanvas: (id: string) => void;
  updateGroup: (id: string, updates: Partial<EditorGroup>) => void;
  removeGroup: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  // ensure sequential zIndex values (0..n-1) matching array order
  normalizeZIndices: () => void;
  setCanvasBackground: (src: string | null) => void;
  setCanvasBackgroundFile: (f: File | null) => void;
  setCanvasBackgroundRepeat: (v: boolean) => void;
  setCanvasTtsModel: (m: string | undefined) => void;
  setCanvasMeta: (text: string) => void;
  setShowCanvaProperties: (v: boolean) => void;
  selectGroup: (id: string | null) => void;
  selectElement: (id: string | null) => void;
  setAspectRatio: (ratio: "9:16" | "16:9") => void;
};

export const useEditorStore = create<EditorState>((set) => {
  const defaultCanvasId = 'canvas_' + crypto.randomUUID();
  return {
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
  canvasTtsModel: undefined,
  showCanvaProperties: false,
  groups: {},
  // initialize with a single default canvas
  canvases: [{ id: defaultCanvasId, width: 450, height: 800, background: null, backgroundRepeat: false, canvasMeta: '', canvasTtsModel: undefined, elements: [], groups: {} }],
  // set currentCanvasId to the id of the default canvas above
  currentCanvasId: defaultCanvasId,
  addElement: (el) =>
    set((s) => {
      // ensure rectangles have a text field (empty by default) and a cornerRadius default
      const rectDefaults: Partial<EditorElement> = el.type === 'rectangle' ? { text: el.text ?? '', cornerRadius: (el as any).cornerRadius ?? 0 } : {};
      const aiImageDefaults: Partial<EditorElement> = el.type === 'aiImage' ? { text: el.text ?? '', aiImagePrompt: (el as any).aiImagePrompt ?? '' } : {};
      const defaults: Partial<EditorElement> = { ...rectDefaults, ...aiImageDefaults };
      // compute zIndex: if caller provided a zIndex use it (useful for templates), otherwise place new element on top (max existing zIndex + 1)
      const maxZ = s.elements.length ? Math.max(...s.elements.map((e) => (typeof e.zIndex === 'number' ? e.zIndex : 0))) : -1;
  const providedZ = (el as any).zIndex;
  // If element belongs to a group, and the group has an initialZ, prefer that when caller
  // didn't explicitly provide a zIndex. This ensures elements created for a group share
  // the same initial zIndex.
  const groupId = (el as any).groupId;
  const groupInitialZ = groupId && s.groups && s.groups[groupId] ? s.groups[groupId]?.initialZ : undefined;
  const zIndexToUse = typeof providedZ === 'number' ? providedZ : (typeof groupInitialZ === 'number' ? groupInitialZ : (maxZ + 1));
      const elWithoutZ = { ...el } as any;
      // ensure we don't carry an id from caller
      delete elWithoutZ.id;
      const newEl = { ...elWithoutZ, id: crypto.randomUUID(), ...defaults, zIndex: zIndexToUse } as EditorElement;
      return { elements: [...s.elements, newEl], selectedId: newEl.id } as any;
    }),
  addGroup: (g) => {
    const id = g.id ?? crypto.randomUUID();
    // compute base z from current elements so group-created elements can share this zIndex
    set((s) => {
      const maxZ = s.elements && s.elements.length ? Math.max(...s.elements.map((e) => (typeof e.zIndex === 'number' ? e.zIndex : 0))) : -1;
      const baseZ = maxZ + 1;
      const group: EditorGroup = { id, name: g.name, aiTopic: g.aiTopic, ttsMode: (g as any).ttsMode ?? 'None', clipDuration: (g as any).clipDuration, ttsQuestionDuration: (g as any).ttsQuestionDuration, answerDuration: (g as any).answerDuration, ttsAnswerDuration: (g as any).ttsAnswerDuration, initialZ: baseZ };
      return { groups: { ...s.groups, [id]: group } } as any;
    });
    return id;
  },
  // create a new empty canvas and switch to it
  newCanvas: (opts) => {
    const id = opts?.id ?? 'canvas_' + crypto.randomUUID();
    set((s) => {
      // save current state into current canvas if exists
      const canv = s.canvases || [];
      const currId = s.currentCanvasId;
      const updatedCanvases = canv.slice();
      if (currId) {
        const idx = updatedCanvases.findIndex((c) => c.id === currId);
        if (idx >= 0) {
          // store copies to avoid shared references between canvases
          updatedCanvases[idx] = { ...updatedCanvases[idx], elements: s.elements.slice(), groups: { ...s.groups }, width: s.canvasWidth, height: s.canvasHeight, background: s.canvasBackground ?? null, backgroundRepeat: !!s.canvasBackgroundRepeat, canvasMeta: s.canvasMeta || '', canvasTtsModel: s.canvasTtsModel };
        }
      }
      const newCanvas: EditorCanvas = { id, width: opts?.width ?? 450, height: opts?.height ?? 800, background: opts?.background ?? null, backgroundRepeat: !!opts?.backgroundRepeat, canvasMeta: opts?.canvasMeta ?? '', canvasTtsModel: opts?.canvasTtsModel, elements: [], groups: {} };
      updatedCanvases.push(newCanvas);
      return { canvases: updatedCanvases, currentCanvasId: id, elements: [], groups: {}, canvasWidth: newCanvas.width, canvasHeight: newCanvas.height, canvasBackground: null, canvasBackgroundRepeat: false, canvasMeta: '', canvasTtsModel: undefined } as any;
    });
    return id;
  },
  // switch to an existing canvas by id (saves current canvas first)
  switchCanvas: (id) => set((s) => {
    if (!s.canvases) return {} as any;
    if (s.currentCanvasId === id) return {} as any;
    const updatedCanvases = s.canvases.slice();
    const currId = s.currentCanvasId;
    if (currId) {
      const idx = updatedCanvases.findIndex((c) => c.id === currId);
      if (idx >= 0) {
        // store copies to avoid shared references between canvases
        updatedCanvases[idx] = { ...updatedCanvases[idx], elements: s.elements.slice(), groups: { ...s.groups }, width: s.canvasWidth, height: s.canvasHeight, background: s.canvasBackground ?? null, backgroundRepeat: !!s.canvasBackgroundRepeat, canvasMeta: s.canvasMeta || '', canvasTtsModel: s.canvasTtsModel };
      }
    }
    const targetIdx = updatedCanvases.findIndex((c) => c.id === id);
    if (targetIdx === -1) return {} as any;
  const target = updatedCanvases[targetIdx];
  return { canvases: updatedCanvases, currentCanvasId: id, elements: (target.elements || []).slice(), groups: { ...target.groups } , canvasWidth: target.width, canvasHeight: target.height, canvasBackground: target.background ?? null, canvasBackgroundRepeat: !!target.backgroundRepeat, canvasMeta: target.canvasMeta || '', canvasTtsModel: target.canvasTtsModel } as any;
  }),
  // delete a canvas (if deleting current, switch to another). If the last canvas is deleted,
  // create a fresh empty canvas so the editor always has one canvas to work with.
  deleteCanvas: (id) => set((s) => {
    const canv = s.canvases || [];
    const idx = canv.findIndex((c) => c.id === id);
    if (idx === -1) return {} as any;
    const updated = canv.slice();
    updated.splice(idx, 1);
    // if no canvases remain, create a new empty default canvas and switch to it
    if (updated.length === 0) {
      const newId = 'canvas_' + crypto.randomUUID();
      const newCanvas: EditorCanvas = { id: newId, width: 450, height: 800, background: null, backgroundRepeat: false, canvasMeta: '', canvasTtsModel: undefined, elements: [], groups: {} };
      return { canvases: [newCanvas], currentCanvasId: newId, elements: [], groups: {}, canvasWidth: newCanvas.width, canvasHeight: newCanvas.height, canvasBackground: null, canvasBackgroundRepeat: false, canvasMeta: '', canvasTtsModel: undefined } as any;
    }
    // if we deleted current canvas, switch to first remaining
    if (s.currentCanvasId === id) {
      const target = updated[0];
      return { canvases: updated, currentCanvasId: target.id, elements: (target.elements || []).slice(), groups: { ...target.groups }, canvasWidth: target.width, canvasHeight: target.height, canvasBackground: target.background ?? null, canvasBackgroundRepeat: !!target.backgroundRepeat, canvasMeta: target.canvasMeta || '', canvasTtsModel: target.canvasTtsModel } as any;
    }
    return { canvases: updated } as any;
  }),
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
    set((s) => {
      // Prevent deleting individual elements that belong to a group.
      const el = s.elements.find((e) => e.id === id);
      if (!el) return {} as any;
      if (el.groupId) {
        // No-op: grouped elements must be deleted by deleting the group.
        return {} as any;
      }
      return {
        elements: s.elements.filter((e) => e.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      } as any;
    }),
  // move the element one step forward in the stacking order (towards end of array)
  bringForward: (id: string) =>
    set((s) => {
      const idx = s.elements.findIndex((e) => e.id === id);
      if (idx === -1 || idx >= s.elements.length - 1) return {} as any;
      const arr = s.elements.slice();
      const tmp = arr[idx + 1];
      arr[idx + 1] = arr[idx];
      arr[idx] = tmp;
      // after swapping array order, reassign zIndex sequentially to match order
      const normalized = arr.map((el, i) => ({ ...el, zIndex: i }));
      return { elements: normalized } as any;
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
      const normalized = arr.map((el, i) => ({ ...el, zIndex: i }));
      return { elements: normalized } as any;
    }),
  normalizeZIndices: () =>
    set((s) => {
      const arr = s.elements.slice().sort((a, b) => (typeof a.zIndex === 'number' ? a.zIndex : 0) - (typeof b.zIndex === 'number' ? b.zIndex : 0));
      const normalized = arr.map((el, i) => ({ ...el, zIndex: i }));
      return { elements: normalized } as any;
    }),
  // When selecting an element, show element properties (hide canvas-level properties)
  selectElement: (id) => set(() => ({ selectedId: id, selectedGroupId: null, showCanvaProperties: false })),
  // Select a group to show group-level properties (hide element and canvas properties)
  selectGroup: (id) => set(() => ({ selectedGroupId: id, selectedId: null, showCanvaProperties: false })),
  setCanvasBackground: (src) => set(() => ({ canvasBackground: src })),
  setCanvasBackgroundFile: (f) => set(() => ({ canvasBackgroundFile: f })),
  setCanvasBackgroundRepeat: (v) => set(() => ({ canvasBackgroundRepeat: v })),
  setCanvasTtsModel: (m) => set(() => ({ canvasTtsModel: m })),
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
  }
});
