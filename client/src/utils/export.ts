import { useEditorStore } from '../store/useEditorStore';
import type { EditorElement, EditorGroup } from '../store/useEditorStore';
import { generateId } from './id';

/**
 * Human-friendly export schema using an assets map.
 */
export type ExportAsset = {
  id: string;
  type: 'image' | string;
  fileName?: string;
  dataUrl?: string; // optional if remote
  src?: string; // remote URL
};

export type ExportElement = {
  id: string;
  type: EditorElement['type'] | 'group';
  groupId?: string | null;
  // all element-specific fields (x, y, width, height, zIndex, text, etc.) live inside properties
  properties?: Record<string, any>;
};

export type ExportGroup = EditorGroup & { elements?: ExportElement[] };

export type ExportCanvas = {
  id: string;
  width: number;
  height: number;
  backgroundAssetId?: string;
  backgroundSrc?: string;
  backgroundRepeat?: boolean;
  canvasMeta?: string;
  canvasTtsModel?: string;
  repeat?: number;
  elements: ExportElement[];
};

export type ExportProject = {
  version: 1;
  createdAt: string;
  app: { name: string; version?: string };
  notes?: string;
  // support multiple canvases in the future; current export will create a single canvas inside this array
  canvases: ExportCanvas[];
  // legacy: older exports may include an `assets` map. New exports inline image `src` on elements.
  assets?: Record<string, ExportAsset>;
};

// (no-op) helper removed — images are inlined as `src` on image elements in the new format

/**
 * Serialize the current editor state into a human-friendly export with assets map.
 */
export function serializeProject(): ExportProject {
  const s = useEditorStore.getState();

  // Canvas background: keep the canvasBackground value (data URL or remote URL) inline on the canvas
  const bgSrc = s.canvasBackground ?? null;

  // Map elements into grouped children and ungrouped list
  const groupedMap: Record<string, ExportElement[]> = {};
  const ungrouped: ExportElement[] = [];

  (s.elements || []).forEach((el) => {
    const z = (s.elements || []).findIndex((ee) => ee.id === el.id);
    const base: ExportElement = {
      id: el.id,
      type: el.type,
      groupId: el.groupId ?? null,
      properties: {
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        zIndex: z >= 0 ? z : undefined,
        // include semantic subtype if present
        subtype: (el as any).subtype ?? undefined,
      } as Record<string, any>,
    };

    // Merge element-specific properties into the properties object
    if (el.type === 'text' || el.type === 'rectangle') {
      Object.assign(base.properties as Record<string, any>, {
        text: el.text ?? '',
        aiText: el.aiText ?? undefined,
        fontSize: el.fontSize,
        fontFamily: el.fontFamily,
        fontColor: el.fontColor,
        bold: el.bold,
        italic: el.italic,
        underline: el.underline,
        align: el.align,
        fillColor: el.fillColor,
        cornerRadius: el.cornerRadius,
      });
    }

    if (el.type === 'image') {
      // Prefer plain src (remote URL). If src is a data URL (local upload), keep it inline since there's no external URL.
      if (el.src) {
        Object.assign(base.properties as Record<string, any>, { src: el.src, fileName: el.fileName });
      }
    }

    if (el.type === 'aiImage') {
      Object.assign(base.properties as Record<string, any>, { aiImagePrompt: el.aiImagePrompt ?? '', text: el.text ?? '' });
    }

    if (el.groupId) {
      groupedMap[el.groupId] = groupedMap[el.groupId] || [];
      groupedMap[el.groupId].push(base);
    } else {
      ungrouped.push(base);
    }
  });

  // helper to convert a canvas state (elements/groups/props) into ExportCanvas
  function convertCanvasState(cs: any): ExportCanvas {
    // build grouped map for this canvas
    const gMap: Record<string, ExportElement[]> = {};
    const ungrp: ExportElement[] = [];
    (cs.elements || []).forEach((el: any) => {
      const z = (cs.elements || []).findIndex((ee: any) => ee.id === el.id);
      const base: ExportElement = {
        id: el.id,
        type: el.type,
        groupId: el.groupId ?? null,
        properties: {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          zIndex: z >= 0 ? z : undefined,
          // include semantic subtype if present
          subtype: (el as any).subtype ?? undefined,
        } as Record<string, any>,
      };
      if (el.type === 'text' || el.type === 'rectangle') {
        Object.assign(base.properties as Record<string, any>, {
          text: el.text ?? '',
          aiText: el.aiText ?? undefined,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          fontColor: el.fontColor,
          bold: el.bold,
          italic: el.italic,
          underline: el.underline,
          align: el.align,
          fillColor: el.fillColor,
          cornerRadius: el.cornerRadius,
        });
      }
      if (el.type === 'image') {
        if (el.src) Object.assign(base.properties as Record<string, any>, { src: el.src, fileName: el.fileName });
      }
      if (el.type === 'aiImage') {
        Object.assign(base.properties as Record<string, any>, { aiImagePrompt: el.aiImagePrompt ?? '', text: el.text ?? '' });
      }
      if (el.groupId) {
        gMap[el.groupId] = gMap[el.groupId] || [];
        gMap[el.groupId].push(base);
      } else {
        ungrp.push(base);
      }
    });

    const elementsOut: ExportElement[] = [
      ...Object.values(cs.groups || {}).map((g: any) => ({
        id: g.id,
        type: 'group' as any,
        groupId: null,
        properties: { zIndex: (gMap[g.id] || []).reduce((acc, e) => (typeof e.properties?.zIndex === 'number' ? Math.min(acc, e.properties!.zIndex as number) : acc), Number.MAX_SAFE_INTEGER) || 0, ...g } as Record<string, any>,
        elements: gMap[g.id] || [],
      } as any)),
      ...ungrp,
    ];

    const canvasOut: ExportCanvas = {
      id: cs.id || generateId('canvas_'),
      width: cs.width,
      height: cs.height,
      backgroundSrc: cs.background ?? undefined,
      backgroundRepeat: !!cs.backgroundRepeat,
      canvasMeta: cs.canvasMeta || undefined,
      canvasTtsModel: cs.canvasTtsModel || undefined,
      repeat: cs.repeat || 0,
      elements: elementsOut,
    };
    return canvasOut;
  }

  // If multiple canvases exist, convert each canvas snapshot. For the currently active canvas
  // use the live editor state (elements/groups/properties) so unsaved changes are exported.
  const sCanvases = s.canvases && s.canvases.length
    ? s.canvases.map((c: any) => {
        if (c.id === s.currentCanvasId) {
          const live = { ...c,
            elements: s.elements,
            groups: s.groups,
            width: s.canvasWidth,
            height: s.canvasHeight,
            background: s.canvasBackground ?? null,
            backgroundRepeat: !!s.canvasBackgroundRepeat,
            canvasMeta: s.canvasMeta,
            canvasTtsModel: s.canvasTtsModel,
            repeat: s.canvasRepeat || 0,
          };
          return convertCanvasState(live);
        }
        return convertCanvasState(c);
      })
    : [convertCanvasState({ id: generateId('canvas_'), width: s.canvasWidth, height: s.canvasHeight, background: bgSrc, backgroundRepeat: !!s.canvasBackgroundRepeat, canvasMeta: s.canvasMeta, canvasTtsModel: s.canvasTtsModel, repeat: s.canvasRepeat || 0, elements: s.elements, groups: s.groups })];  const out: ExportProject = {
    version: 1,
    createdAt: new Date().toISOString(),
    app: { name: 'reelMakerAI', version: undefined },
    notes: 'Export generated by reelMakerAI',
    canvases: sCanvases,
  };

  return out;
}

/**
 * Deserialize an ExportProject object (v1) and restore into the store.
 * This will overwrite elements/groups/canvas. Caller should confirm before calling.
 */
export async function deserializeProject(obj: unknown): Promise<void> {
  if (!obj || typeof obj !== 'object') throw new Error('Invalid project JSON');
  const project = obj as Partial<ExportProject>;
  if (project.version !== 1) throw new Error('Unsupported project version: ' + String(project.version));
  // Support both new `canvases` array and legacy single `canvas` + top-level `elements`
  const assets = project.assets || {};
  const canvases = (project as any).canvases as ExportCanvas[] | undefined;
  const legacyCanvas = (project as any).canvas as any | undefined;
  const legacyElements = (project as any).elements as ExportElement[] | undefined;
  if (!canvases && (!legacyCanvas || !legacyElements)) throw new Error('Malformed project JSON');

  // helper to resolve assetId or src
  function resolveImage(properties: any) {
    if (!properties) return { src: undefined, fileName: undefined };
    if (properties.assetId && assets[properties.assetId] && assets[properties.assetId].dataUrl) {
      return { src: assets[properties.assetId].dataUrl, fileName: assets[properties.assetId].fileName };
    }
    if (properties.src) return { src: properties.src, fileName: properties.fileName };
    return { src: undefined, fileName: properties.fileName };
  }

  // recreate elements in the shape of EditorElement
  // elements may include group elements (type === 'group') which contain children
  // Prefer new canvases[0].elements; fall back to legacy top-level elements
  // If multiple canvases are present, convert each canvas into EditorCanvas-like state
  const canvasesToImport: ExportCanvas[] = canvases && canvases.length > 0 ? canvases : (legacyCanvas ? [legacyCanvas] : []);
  const importedCanvases = canvasesToImport.map((cv) => {
    const projectElements: ExportElement[] = cv.elements || [];
    const elementsFromGroups: ExportElement[] = [];
    const groupsArrayFromElements: ExportGroup[] = [];
    for (const pe of projectElements) {
      if ((pe as any).type === 'group') {
        const grpProps = (pe as any).properties || {};
        groupsArrayFromElements.push({ ...(grpProps as ExportGroup), id: pe.id } as ExportGroup);
        const children = (pe as any).elements || [];
        for (const c of children) {
          c.groupId = pe.id;
          elementsFromGroups.push(c);
        }
      }
    }
    const topLevelElements = projectElements.filter((e) => (e as any).type !== 'group');
    const allExportElements: ExportElement[] = [...topLevelElements, ...elementsFromGroups];
    const sorted = allExportElements.slice().sort((a, b) => {
      const za = typeof a.properties?.zIndex === 'number' ? a.properties!.zIndex as number : 0;
      const zb = typeof b.properties?.zIndex === 'number' ? b.properties!.zIndex as number : 0;
      return za - zb;
    });

    const elements: EditorElement[] = sorted.map((el) => {
      const props = el.properties || {};
      const common: Partial<EditorElement> = {
        id: el.id,
        type: el.type as any,
        groupId: el.groupId ?? undefined,
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        // restore optional subtype if present
        subtype: props.subtype,
      };
      if (el.type === 'text' || el.type === 'rectangle') {
        Object.assign(common, {
          text: props.text ?? '',
          aiText: props.aiText ?? undefined,
          fontSize: props.fontSize,
          fontFamily: props.fontFamily,
          fontColor: props.fontColor,
          bold: props.bold,
          italic: props.italic,
          underline: props.underline,
          align: props.align,
          fillColor: props.fillColor,
          cornerRadius: props.cornerRadius,
        });
      }
      if (el.type === 'image') {
        const resolved = resolveImage(props);
        Object.assign(common, { src: resolved.src, fileName: resolved.fileName });
      }
      if (el.type === 'aiImage') {
        Object.assign(common, { aiImagePrompt: props.aiImagePrompt ?? '', text: props.text ?? '' });
      }
      return common as EditorElement;
    });

    const groupsRecord: Record<string, EditorGroup> = {};
    for (const g of groupsArrayFromElements) {
      if (!g.id) continue;
      groupsRecord[g.id] = g as EditorGroup;
    }

    return {
      id: cv.id || generateId('canvas_'),
      width: cv.width,
      height: cv.height,
      background: cv.backgroundSrc ?? null,
      backgroundRepeat: !!cv.backgroundRepeat,
      canvasMeta: cv.canvasMeta || '',
      canvasTtsModel: cv.canvasTtsModel,
      repeat: cv.repeat || 0,
      elements,
      groups: groupsRecord,
    } as any;
  });
  // Before applying imported data, reset editor UI to a clean default state so there
  // are no lingering uploads, selections or ephemeral fields that could interfere
  // with the imported project. This ensures a consistent starting point for import.
  useEditorStore.setState({
    elements: [],
    selectedId: null,
    selectedGroupId: null,
    canvasWidth: 450,
    canvasHeight: 800,
    canvasBackground: null,
    canvasBackgroundFile: null,
    canvasBackgroundRepeat: false,
    canvasMeta: '',
    canvasTtsModel: undefined,
    canvasRepeat: 0,
    canvases: [],
    currentCanvasId: null,
    showCanvaProperties: false,
    groups: {},
  } as any);

  // apply to store: set canvases and load the first canvas into the editor
  const first = importedCanvases[0];
  useEditorStore.setState({
    canvases: importedCanvases,
    currentCanvasId: first.id,
    elements: first.elements,
    groups: first.groups,
    canvasWidth: first.width,
    canvasHeight: first.height,
    canvasBackground: first.background ?? null,
    canvasBackgroundRepeat: !!first.backgroundRepeat,
    canvasMeta: first.canvasMeta || '',
    canvasTtsModel: first.canvasTtsModel,
    canvasRepeat: first.repeat || 0,
    selectedId: null,
    selectedGroupId: null,
    showCanvaProperties: false,
  } as any);

  return;
}
