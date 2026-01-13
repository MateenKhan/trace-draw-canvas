# Hierarchical Tree Dragging System

## Overview
The Layers Panel now supports a fully hierarchical tree structure with advanced drag-and-drop capabilities. Users can drag layers/projects both **vertically** (to reorder) and **horizontally** (to change hierarchy depth and parent-child relationships).

## Key Features

### 1. **Flat Tree Rendering**
- Uses `flattenTree()` utility to convert the hierarchical tree into a flat list
- Each item (node or shape) is rendered at the correct depth with proper indentation
- Shapes are rendered as separate items in the flat list, not nested inside nodes
- This approach eliminates jitter and provides stable drag-and-drop

### 2. **Horizontal Dragging for Hierarchy**
- **Drag Left**: Move item to a shallower depth (promote to parent/sibling)
- **Drag Right**: Move item to a deeper depth (demote to child)
- **Indent Step**: 12px per level
- The system calculates `depthDelta = Math.round(offsetLeft / 12)` to determine hierarchy changes

### 3. **Vertical Dragging for Reordering**
- Drag up/down to reorder items within the same parent or across parents
- The `over` item determines the new position in the flat list
- Smart parent detection based on the item above the drop position

### 4. **Smart Parent Assignment**
- When dropping, the system finds the appropriate parent based on:
  - The item immediately before the drop position
  - The calculated depth from horizontal dragging
  - Type constraints (only projects can have children)
- Root project cannot be moved or reparented

### 5. **Visual Feedback**
- **Indentation**: Each level is indented by 12px
- **Drag Handle**: GripVertical icon for initiating drags
- **Running Border Animation**: Shows on both origin and drop positions
- **Opacity Change**: Dragged item becomes semi-transparent
- **No Scaling**: Removed scale effects to prevent jitter

## Technical Implementation

### File Structure
```
src/
├── lib/
│   └── layer-tree.ts          # FlattenedItem type, flattenTree utility
├── components/
│   ├── LayersPanel.tsx         # Main panel with flat rendering
│   └── layers/
│       ├── LayerTreeItem.tsx   # Node component (simplified for flat mode)
│       └── ShapeItem.tsx       # Shape component with depth support
```

### Key Functions

#### `flattenTree(state, objectsMap, nodeIds)`
Recursively flattens the tree structure:
```typescript
export function flattenTree(
    state: LayerTreeState,
    objectsMap: Record<string, any[]>,
    nodeIds: string[],
    depth = 0,
    parentId: string | null = null
): FlattenedItem[]
```

Returns an array of `FlattenedItem`:
- `{ type: 'node', id, node, depth, parentId }` for layers/projects
- `{ type: 'shape', id, object, depth, parentId }` for shapes

#### `handleDragEnd(event)`
Processes drag completion:
1. Calculates `depthDelta` from horizontal movement (`offsetLeft`)
2. Finds the active and over items in the flat list
3. For **shapes**: Updates the `layerId` property
4. For **nodes**:
   - Removes from old parent's children array
   - Determines new parent based on depth and position
   - Inserts into new parent's children array
   - Updates node's `parentId`

### State Management
```typescript
const [offsetLeft, setOffsetLeft] = useState(0);  // Tracks horizontal drag
const [activeDragData, setActiveDragData] = useState<any>(null);  // Drag metadata
const flattenedItems = useMemo(() => flattenTree(tree, objectsMap, tree.rootIds), [tree, objectsMap]);
```

### DND Configuration
```typescript
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragMove={handleDragMove}      // Tracks offsetLeft
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
  measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
  autoScroll={{ threshold: { x: 0, y: 60 }, acceleration: 4 }}
  modifiers={[]}  // No vertical restriction for horizontal dragging
>
```

## User Interactions

### Creating New Items
- **New Project** button: Creates a project under the active layer
- **New Layer** button: Creates a layer under the active layer
- Both buttons are located below the search bar

### Dragging Behavior
1. **Grab the drag handle** (GripVertical icon)
2. **Drag vertically** to reorder
3. **Drag horizontally** to change depth:
   - Right: Make it a child of the item above
   - Left: Promote to a shallower level
4. **Release** to apply changes

### Visual Indicators
- **Indentation**: Shows hierarchy depth (12px per level)
- **Expand/Collapse**: Chevron icon toggles child visibility
- **Running Border**: Animated border on drop (2s duration)
- **Opacity**: Dragged item at 40% opacity

## Stability Improvements

### Jitter Reduction
1. **Removed CSS Scaling**: No `scale-[0.98]` during drag
2. **Conditional Transitions**: `transition: 'none'` while dragging
3. **Hardware Acceleration**: `willChange: 'transform'` on all draggable items
4. **Flat Rendering**: No recursive nesting during render
5. **DndContext Outside Scroll**: Prevents double-scrolling conflicts

### Mobile Optimizations
- **Touch Sensors**: Long press (250ms) to initiate drag
- **Swipe Gestures**: Still available for delete actions
- **Drag Handle**: Prevents accidental drags on scroll

## Future Enhancements
- [ ] Persist tree state to localStorage/backend
- [ ] Add node visibility toggle (currently only shapes have visibility)
- [ ] Implement multi-select drag
- [ ] Add keyboard shortcuts for hierarchy changes
- [ ] Undo/redo support for tree operations
