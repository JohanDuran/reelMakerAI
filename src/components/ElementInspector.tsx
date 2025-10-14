import { useEditorStore } from "../store/useEditorStore";
import { Paper } from '@mui/material';

export function ElementInspector() {
  const { elements, selectedId, updateElement } = useEditorStore();
  const element = elements.find((e) => e.id === selectedId);

  if (!element)
    return (
      <Paper elevation={1} style={{ width: '100%', height: '100%', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-center items-center text-gray-500">
          No element selected
        </div>
      </Paper>
    );

  // Grid layout: two columns - label (fixed) and control (flexible)
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '96px 1fr', columnGap: '12px', rowGap: '10px', alignItems: 'center' };

  return (
    <Paper elevation={1} style={{ width: '100%', height: '100%', padding: 16, display: 'flex', flexDirection: 'column' }}>
      <div className="w-64 border-l bg-white p-4">
        <h3 className="font-semibold mb-3">Element Inspector</h3>

        <div style={gridStyle}>
          {element.type === 'text' && (
            <>
              <div className="text-sm font-medium text-gray-700">Text</div>
              <div>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={element.text || ''}
                  onChange={(e) => updateElement(element.id, { text: e.target.value })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Font size</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.fontSize || 24}
                  onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value || '0') })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Width</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.width}
                  onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value || '0') })}
                />
              </div>
            </>
          )}

          <div className="text-sm font-medium text-gray-700">X</div>
          <div>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={element.x}
              onChange={(e) => updateElement(element.id, { x: parseInt(e.target.value || '0') })}
            />
          </div>

          <div className="text-sm font-medium text-gray-700">Y</div>
          <div>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={element.y}
              onChange={(e) => updateElement(element.id, { y: parseInt(e.target.value || '0') })}
            />
          </div>

          {element.type === 'image' && (
            <>
              <div className="text-sm font-medium text-gray-700">Width</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.width}
                  onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value || '0') })}
                />
              </div>

              <div className="text-sm font-medium text-gray-700">Height</div>
              <div>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={element.height}
                  onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value || '0') })}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Paper>
  );
}
