# Functionality Index

This document maps the core functionalities of the application to their corresponding files and components to aid in maintenance and navigation.

## Core Editor


| Functionality | File / Component | Description |
| :--- | :--- | :--- |
| **Main Canvas Logic** | `src/components/CanvasEditor.tsx` | Orchestrates the Fabric.js canvas, tool selection, and event handling. |
| **Drawing Tools** | `src/components/DrawingToolbar.tsx` | UI and logic for switching between pencil, brush, shapes, etc. |
| **Selection Tools** | `src/components/SelectionToolbar.tsx` | Tools for manipulating selected objects (group, ungroup, align). |
| **Left Toolbar** | `src/components/Toolbar.tsx` | Primary vertical toolbar for high-level mode switching. |
| **Properties** | `src/components/PropertyPanel.tsx` | Editing properties of selected objects (color, stroke, dimensions). |

## 3D & Extrusion

| Functionality | File / Component | Description |
| :--- | :--- | :--- |
| **Live 3D Preview** | `src/components/Inline3DExtrude.tsx` | Renders the 2D shapes as extruded 3D meshes using Three.js. |
| **Extrusion Settings** | `src/components/Extrusion3DDialog.tsx` | Dialog for configuring extrusion depth and settings. |

## Computer Numerical Control (CNC) / G-Code

| Functionality | File / Component | Description |
| :--- | :--- | :--- |
| **G-Code Generation** | `src/components/GCodePanel.tsx` | Configuration and generation of G-Code toolpaths. |
| **G-Code Export** | `src/components/GCodeDialog.tsx` | Final review and export dialog for G-Code files. |
| **Simulation** | `src/components/MobileSimulationPlayer.tsx` | Visual playback of the G-Code toolpath execution. |
| **Toolpaths** | `src/components/ToolpathOverlay.tsx` | Visual overlay of generated toolpaths on the canvas. |

## Project Management

| Functionality | File / Component | Description |
| :--- | :--- | :--- |
| **Project List** | `src/components/ProjectsPanel.tsx` | Managing, saving, and loading user projects. |
| **History / Undo** | `src/components/HistoryPanel.tsx` | Canvas undo/redo history management. |
| **Project History** | `src/components/ProjectHistoryPanel.tsx` | Version history for projects. |
| **Recovery** | `src/components/RecoveryDialog.tsx` | Recovering lost work or previous sessions. |

## Layers & Images

| Functionality | File / Component | Description |
| :--- | :--- | :--- |
| **Layer Management** | `src/components/LayersPanel.tsx` | Managing canvas layers (z-index, visibility, locking). |
| **Image Upload** | `src/components/ImageUploadDialog.tsx` | Handling image imports into the canvas. |
| **Tracing** | `src/components/TraceSettingsPanel.tsx` | Configuration for bitmap-to-vector tracing (Potrace). |

## Layout & Base UI

| Functionality | File / Component | Description |
| :--- | :--- | :--- |
| **App Routing** | `src/App.tsx` | Main application routing and context providers. |
| **Main Layout** | `src/pages/Index.tsx` | Wrapper for the full-screen editor layout. |
| **Sidebar** | `src/components/EditorSidebar.tsx` | Collapsible sidebar container for panels. |

## Utilities

| Functionality | File / Component | Description |
| :--- | :--- | :--- |
| **SVG Preview** | `src/components/SvgPreview.tsx` | Utility to preview SVG exports. |
| **File Export** | `src/components/ExportMenu.tsx` | General export options (PNG, SVG, JSON). |
