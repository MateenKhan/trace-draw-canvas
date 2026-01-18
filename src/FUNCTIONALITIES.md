# Trace Draw Canvas Functionalities Index

This file provides an index of the core functionalities and their implementation locations in the codebase.

## Core Hooks

- **`useCanvas.ts`**: Main canvas initialization, image loading, and basic canvas operations (zoom, clear, reset).
- **`useDrawingTools.ts`**: Implements tools for drawing basic shapes (rectangle, ellipse, line, polygon), text, and freehand drawing (pencil/pen).
- **`useImageEditing.ts`**: Handles image filters (brightness, contrast, etc.), flipping, rotation, and scaling.
- **`useMobileDrawing.ts`**: Specialized logic for touch-based drawing and shape creation on mobile devices.
- **`useCanvasSync.ts`**: Synchronizes the UI state (colors, text styles) with the currently selected object on the canvas.
- **`useUndoRedo.ts`**: Manages the undo/redo history stack for canvas state.
- **`useSplineTool.ts`**: Implementation of the spline/curve drawing tool.
- **`useAutoSave.ts`**: Periodically saves the canvas state.

## Components

- **`CanvasEditor.tsx`**: The main orchestrator component that combines all hooks and UI elements.
- **`DrawingToolbar.tsx`**: UI for selecting drawing tools and categories.
- **`PropertyPanel.tsx`**: Controls for adjusting properties of selected objects (colors, dimensions, text styles).
- **`TraceSettingsPanel.tsx`**: Settings for image-to-SVG tracing logic.
- **`LayersPanel.tsx`**: Management of canvas layers and groups.
- **`HistoryPanel.tsx`**: UI for navigating and managing the undo history.
- **`ProjectsPanel.tsx`**: Project management UI (create, open, rename, delete).
- **`GCodeDialog.tsx`**: UI for exporting and simulating G-code.

## Libraries & Utilities

- **`tracing.ts`**: Logic for converting image data to SVG paths.
- **`gcode.ts`**: Utilities for extracting toolpaths and generating G-code.
- **`projects.ts`**: Persistence layer for project and snapshot management.
- **`layers.ts`**: Definitions and helpers for layer management.
- **`types.ts`**: Shared TypeScript interfaces and constants.

## Important Configurations

- **`vite.config.ts`**: Build and development server configuration.
- **`tailwind.config.ts`**: Design system and CSS utility configuration.
- **`tsconfig.json`**: TypeScript compiler options and path aliases.
