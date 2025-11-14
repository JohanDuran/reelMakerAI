// automatic JSX runtime used; no default React import required

type Props = {
  editing: null | { id: string; left: number; top: number; width: number; height: number; text?: string };
  elements: any[];
  updateElement: (id: string, patch: any) => void;
  setEditing: (v: any) => void;
};

// InlineTextEditor: a floating textarea used to edit text nodes in the canvas
export function InlineTextEditor({ editing, elements, updateElement, setEditing }: Props) {
  if (!editing) return null;
  const el = elements.find((x) => x.id === editing.id);
  return (
    <div
      key={editing.id}
      style={{ position: 'absolute', left: editing.left, top: editing.top, width: editing.width, zIndex: 50 }}
    >
      <textarea
        autoFocus
        value={editing.text}
        onChange={(e) => {
          const txt = e.target.value;
          setEditing({ ...editing, text: txt });
          updateElement(editing.id, { text: txt });
        }}
        onBlur={() => setEditing(null)}
        onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null); }}
        style={{ width: '100%', minHeight: editing.height, resize: 'vertical', fontSize: (el?.fontSize || 24) + 'px', lineHeight: '1.1', fontFamily: el?.fontFamily || 'inherit', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', padding: '2px', fontStyle: el?.italic ? 'italic' : 'normal', fontWeight: el?.bold ? 'bold' : 'normal' }}
      />
    </div>
  );
}

export default InlineTextEditor;
