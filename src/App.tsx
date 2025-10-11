import { CanvasEditor } from "./components/CanvasEditor";
import { Toolbar } from "./components/Toolbar";
import { ElementInspector } from "./components/ElementInspector";

export default function App() {
  return (
    <div className="w-full h-screen flex flex-col">
      <Toolbar />
      <div className="flex flex-1">
        <div className="flex-1 flex justify-center items-center bg-gray-50">
          <CanvasEditor />
        </div>
        <ElementInspector />
      </div>
    </div>
  );
}
