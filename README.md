## To build the image
docker build -t vite-react-dev -f Dockerfile.dev .  

## To run the container and also to recreate the image
docker compose up -d --build
# reelMakerAI

A small, local React + TypeScript canvas editor built with Konva and Zustand. The app is designed for rapid composition of simple scenes (text, rectangles, images) with an inspector panel, inline text editing, single Transformer resizing, and canvas-level background and metadata support.

This README explains the project's structure, what each major UI section does, how to run the app, and developer notes for working on the codebase.

## Key technologies
- React + TypeScript
- Vite
- Konva + react-konva (canvas rendering)
- Zustand (app state)
- Material UI (v5) for theming and UI components

## Project structure (important files)
- `src/`
	- `App.tsx` — top-level app wrapper and layout
	- `main.tsx` — app entry, sets up MUI theme and global providers
	- `theme.tsx` — MUI dark theme configuration
	- `components/`
		- `CanvasEditor.tsx` — main composition area. Sets up the scaled canvas container, handles selection, right-click context menu, keyboard shortcuts (Delete, Esc), and composes the stage and inspector.
		- `ContextMenu.tsx` — right-click context menu for selected elements (bring forward, send backward, duplicate, deselect). Now positioned relative to the canvas and uses dark styling.
		- `ElementInspector.tsx` — the inspector which shows either canvas properties or the selected element's properties. Controls fonts, color, AI meta fields, alignment, and uploads for images/canvas background.
		- `SelectionPanel.tsx` — UI to add new elements (text, rectangle, image) and toggle canvas properties; uses unified Add buttons.
		- `ui/CardPanel.tsx` — small panel wrapper using MUI `Paper` for consistent theming.
		- `canvas/CanvasStage.tsx` — renders the Konva `Stage` and `Layer`, elements (Text, Image, Rect), handles inline editing overlay, Transformer logic, upload placeholders, and drag/resize behavior.
		- `canvas/InlineTextEditor.tsx` — HTML textarea overlay used for double-click inline editing of text elements.
	- `store/useEditorStore.ts` — Zustand store containing elements, selection, canvas-level state (background, repeats, canvas meta), and common actions (add/update/select/remove elements).
	- `utils/readFile.ts` — small helper that reads a File and returns a data URL as a Promise.

## What each UI section does
- Canvas / Stage (center)
	- The Konva-powered drawing surface where elements are rendered.
	- Supports text, rectangle, and image elements.
	- Single Transformer is attached to the selected element for resizing; rotation is disabled.
	- Double-click text to edit inline via an HTML overlay (keeps typed fonts accurate).
	- Right-click on a selected element to open a context menu with actions (now styled for the dark theme and placed at the right-click position).
	- Click blank space to deselect current element; press ESC to clear selection and open canvas properties.

- Inspector (right column)
	- Shows either Canvas properties (background image, canvas AI meta prompt, repeat toggle) or Element properties for the selected element.
	- Element properties include text content, font size, font color, font family, style toggles (bold, italic, underline), alignment, width/height for images, AI fields, and the ability to upload/remove element images.
	- Some state (x, y) is intentionally stored but hidden from the inspector to keep UI focused on visual editing.

- Toolbar / Selection Panel (left or top depending on layout)
	- Buttons to add new elements (Text, Rectangle, Image).
	- A persistent Canvas toggle button (if present) opens canvas properties when there's no blank canvas space to click.

- Context menu
	- Right-click on selected element to open bring forward / send backward, duplicate, and deselect actions.
	- Positioned relative to the canvas container and clamped so it doesn't overflow outside the canvas.

## How to run
Requirements
- Node.js (16+ recommended)
- npm (or yarn)

Install & run

```powershell
# from the project root
npm install
npm run dev
```

Open the dev URL printed by Vite (usually http://localhost:5173).

## Developer notes & guidelines
- The app uses a single Transformer instance attached to the selected Konva node. Transformer transforms are reconciled into store updates (scale → font size/width etc.). See `CanvasStage.tsx` for details.
- Inline images are loaded via a small `useImage` helper inside `CanvasStage.tsx` to avoid external runtime dependency issues.
- `readFileAsDataURL` in `src/utils/readFile.ts` should be used for file uploads to centralize behavior and error handling. Some legacy places still use FileReader directly — consider replacing them for consistency.
- The right-click `ContextMenu` is rendered using absolute positioning inside the canvas container and now receives coordinates relative to that container (see `CanvasEditor.tsx`). If you expand menu content, update the clamping logic or switch to measuring the rendered menu and repositioning after render.
- Styling: a MUI dark theme is applied globally (`src/theme.tsx`). Many UI pieces are migrated to use MUI `Paper` or MUI components, but a few inputs still use minimal inline styling; migrating them to MUI `TextField` / `Select` would improve consistency and accessibility.

## Future improvements (suggestions)
- Replace inline-styled controls with MUI components for better accessibility and consistent focus/hover states.
- Add keyboard navigation to the context menu (Arrow keys, Enter, Escape).
- Make the context menu measure itself after mount and reposition precisely to avoid approximate clamping.
- Add touch support for dragging upload placeholders and Transformer anchors on touch devices.
- Add unit tests for the store and a couple of integration tests for basic element add/remove/duplicate flows.

---
If you'd like, I can extend the README with screenshots, a short video GIF, or project badges (license, build, dependencies). Which additions would be most helpful?