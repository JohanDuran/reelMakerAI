import { CanvasEditor } from "./components/CanvasEditor";
import { Toolbar } from "./components/Toolbar";
import { ElementInspector } from "./components/ElementInspector";
import { SelectionPanel } from "./components/SelectionPanel";

export default function App() {
  return (
    <div className="w-full h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1" style={{ display: 'grid', gridTemplateColumns: '18rem 1fr 18rem', gap: 16 }}>
        <div style={{ padding: 12 }}>
          <SelectionPanel />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', height: '100%' }}>
          <CanvasEditor />
        </div>
        <div style={{ padding: 12 }}>
          <ElementInspector />
        </div>
      </div>
    </div>
  );
}
