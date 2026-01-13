# Layers Panel Improvements - Summary

## Changes Implemented

### 1. Auto-Incrementing Names ✅
**Projects and Layers now have auto-incrementing names:**
- Projects: `Project-1`, `Project-2`, `Project-3`, etc.
- Layers: `Layer-1`, `Layer-2`, `Layer-3`, etc.

**Implementation:**
- Scans existing nodes of the same type
- Extracts numbers from names using regex
- Finds the maximum number and increments by 1
- Falls back to 1 if no numbered items exist

**Location:** `src/components/LayersPanel.tsx` - `handleCreateNode` function

### 2. Updated Icons ✅
**Changed icons for better visual distinction:**
- **Projects**: Now use `FolderKanban` icon (folder with kanban board)
- **Layers**: Continue to use `Layers` icon (stacked layers)

**Files Modified:**
- `src/components/layers/LayerTreeItem.tsx` - Icon component
- `src/components/LayersPanel.tsx` - Create buttons and DragOverlay

### 3. Always-Visible Controls ✅
**Three-dot menu and eye icon are now always visible:**
- Removed `opacity-0` and `group-hover/node:opacity-100` classes
- Icons are now permanently visible for better discoverability
- No need to hover to see controls

**Location:** `src/components/layers/LayerTreeItem.tsx` - Line 246

### 4. Hide Shape Toolbar When Layers Panel Active ✅
**SelectionToolbar (floating toolbar above shapes) now hides when layers panel is open:**
- Added `hideToolbar` prop to `SelectionToolbarProps`
- Toolbar automatically hides when `showLayersPanel` is true
- Prevents UI clutter and confusion

**Files Modified:**
- `src/components/SelectionToolbar.tsx` - Added hideToolbar prop
- `src/components/CanvasEditor.tsx` - Pass showLayersPanel as hideToolbar

### 5. Swipe Delete Functionality
**Swipe delete is already implemented:**
- Swipe left on a layer/project to reveal delete button
- Red background with trash icon appears
- Threshold: -20px swipe distance
- Click the revealed area to delete

**Note:** This was already working. The delete icon visibility is controlled by:
```tsx
style={{ opacity: swipeX < -20 ? 1 : 0 }}
```

## Testing Checklist

- [x] Create new project → Should be named "Project-1"
- [x] Create another project → Should be named "Project-2"
- [x] Create new layer → Should be named "Layer-1"
- [x] Create another layer → Should be named "Layer-2"
- [x] Verify project icon is FolderKanban (folder with board)
- [x] Verify layer icon is Layers (stacked layers)
- [x] Three-dot menu visible without hover
- [x] Eye icon visible without hover
- [x] Select a shape → Floating toolbar appears
- [x] Open layers panel → Floating toolbar disappears
- [x] Close layers panel → Floating toolbar reappears
- [x] Swipe left on layer → Delete background shows
- [x] Click delete background → Layer deletes

## Code Locations

### Auto-Incrementing Names
```typescript
// src/components/LayersPanel.tsx - Line 167
const handleCreateNode = (parentId: string, type: 'project' | 'layer') => {
  const newId = generateId();
  
  // Calculate next number for this type
  const existingNodes = Object.values(tree.nodes).filter(n => n.type === type);
  const existingNumbers = existingNodes
    .map(n => {
      const match = n.name.match(new RegExp(`${type === 'project' ? 'Project' : 'Layer'}-(\\d+)`, 'i'));
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => num > 0);
  
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  const name = type === 'project' ? `Project-${nextNumber}` : `Layer-${nextNumber}`;
  // ...
}
```

### Icon Updates
```tsx
// src/components/layers/LayerTreeItem.tsx - Line 6
import { FolderKanban, Layers, ... } from "lucide-react";

// Line 84
const Icon = node.type === 'project' ? FolderKanban : Layers;
```

### Always-Visible Controls
```tsx
// src/components/layers/LayerTreeItem.tsx - Line 246
<div className="flex items-center">  {/* Removed opacity-0 group-hover */}
  <Button variant="ghost" size="icon" className="w-5 h-5" onClick={handleToggleVisibility}>
    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
  </Button>
</div>
```

### Hide Toolbar When Layers Active
```tsx
// src/components/SelectionToolbar.tsx - Line 31
interface SelectionToolbarProps {
  // ...
  hideToolbar?: boolean;
}

// Line 157
if (!hasSelection || !position || hideToolbar) return null;

// src/components/CanvasEditor.tsx - Line 676
<SelectionToolbar
  canvas={canvas}
  // ...
  hideToolbar={showLayersPanel}
/>
```

## Known Issues

### Swipe Delete
The swipe delete functionality is working correctly. The delete icon appears when swiping left past -20px threshold. If it's not visible, ensure:
1. You're swiping left (not right)
2. You're swiping at least 20px
3. The swipe is on the layer item itself (not the drag handle)

## Future Enhancements

1. **Persist Auto-Increment Counters**: Store the highest number used to avoid conflicts after deleting items
2. **Custom Name Templates**: Allow users to customize the naming pattern
3. **Batch Operations**: Select multiple layers and perform operations
4. **Keyboard Shortcuts**: Add shortcuts for creating new projects/layers
