# Layer Tree Persistence Fix

## Problem
New projects and layers were disappearing after closing the layers menu. The layer tree state was being reset to initial state every time the LayersPanel component remounted.

## Root Cause
The `tree` state was initialized with `createInitialState(projectName)` on every component mount:
```tsx
const [tree, setTree] = useState<LayerTreeState>(createInitialState(projectName));
```

When the layers panel closed and reopened, React would remount the component, calling `createInitialState` again and losing all user changes.

## Solution: localStorage Persistence

### 1. Load from localStorage on Init ✅
```tsx
const [tree, setTree] = useState<LayerTreeState>(() => {
  try {
    const saved = localStorage.getItem('layerTreeState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that it has the required structure
      if (parsed.nodes && parsed.rootIds) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load layer tree state:', error);
  }
  return createInitialState(projectName);
});
```

**Benefits:**
- Lazy initialization (function passed to useState)
- Only runs once on component mount
- Validates structure before using saved data
- Falls back to initial state if loading fails

### 2. Save to localStorage on Changes ✅
```tsx
useEffect(() => {
  try {
    localStorage.setItem('layerTreeState', JSON.stringify(tree));
  } catch (error) {
    console.error('Failed to save layer tree state:', error);
  }
}, [tree]);
```

**Benefits:**
- Automatically saves whenever tree changes
- Persists across page reloads
- Survives component unmount/remount
- Error handling for quota exceeded

## What Gets Persisted

### Layer Tree Structure
```typescript
interface LayerTreeState {
  nodes: Record<string, LayerNodeData>;
  rootIds: string[];
}

interface LayerNodeData {
  id: string;
  type: 'project' | 'layer';
  name: string;
  expanded: boolean;
  children: string[];
  parentId: string | null;
}
```

### Persisted Data Includes:
- ✅ All projects and layers
- ✅ Hierarchy (parent-child relationships)
- ✅ Names (Project-1, Layer-2, etc.)
- ✅ Expanded/collapsed state
- ✅ Order of items

### NOT Persisted (Yet):
- ❌ Canvas shapes/objects
- ❌ Shape-to-layer assignments
- ❌ Canvas state (zoom, pan)
- ❌ Undo/redo history

## Storage Key
```
localStorage key: 'layerTreeState'
```

## Testing

### Test Persistence
1. Create a new project → "Project-1"
2. Create a new layer → "Layer-1"
3. Close layers panel
4. Reopen layers panel
5. ✅ Project-1 and Layer-1 should still be there

### Test Page Reload
1. Create several projects and layers
2. Refresh the page (F5)
3. ✅ All projects and layers should persist

### Test Error Handling
1. Fill localStorage to quota
2. Create new layer
3. ✅ Should log error but not crash
4. ✅ State still works in memory

## Limitations

### localStorage Quota
- **Typical limit**: 5-10 MB per domain
- **Current usage**: ~1-5 KB for typical layer tree
- **Max realistic layers**: ~10,000 nodes before hitting quota

### Data Loss Scenarios
1. **User clears browser data** → All layers lost
2. **Incognito/Private mode** → Not persisted across sessions
3. **Different browsers** → Each has separate storage
4. **localStorage disabled** → Falls back to session-only state

## Future Enhancements

### 1. Cloud Sync
```tsx
// Save to backend API
const saveToCloud = async (tree: LayerTreeState) => {
  await fetch('/api/projects/save', {
    method: 'POST',
    body: JSON.stringify({ tree })
  });
};
```

### 2. Multiple Projects
```tsx
// Save per-project
localStorage.setItem(`layerTree_${projectId}`, JSON.stringify(tree));
```

### 3. Export/Import
```tsx
// Export to JSON file
const exportTree = () => {
  const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // Download file...
};

// Import from JSON file
const importTree = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imported = JSON.parse(e.target.result as string);
    setTree(imported);
  };
  reader.readAsText(file);
};
```

### 4. Versioning
```tsx
interface PersistedState {
  version: number;
  tree: LayerTreeState;
  timestamp: number;
}

// Migrate old versions
const migrate = (saved: any): LayerTreeState => {
  if (saved.version === 1) {
    // Migrate v1 to v2
  }
  return saved.tree;
};
```

### 5. Compression
```tsx
import pako from 'pako';

// Compress before saving
const compressed = pako.deflate(JSON.stringify(tree));
localStorage.setItem('layerTreeState', btoa(String.fromCharCode(...compressed)));

// Decompress when loading
const compressed = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
const decompressed = pako.inflate(compressed, { to: 'string' });
const tree = JSON.parse(decompressed);
```

## Clear Saved State

### Manual Clear (Developer Console)
```javascript
localStorage.removeItem('layerTreeState');
location.reload();
```

### Programmatic Clear
```tsx
const clearLayerTree = () => {
  localStorage.removeItem('layerTreeState');
  setTree(createInitialState(projectName));
  toast.success('Layer tree reset');
};
```

## Files Modified

- `src/components/LayersPanel.tsx`
  - Line 44-57: Initialize from localStorage
  - Line 95-103: Save to localStorage on changes

## Migration Path

If you need to change the data structure:

1. **Add version field**:
```tsx
const CURRENT_VERSION = 2;

const saved = localStorage.getItem('layerTreeState');
const data = JSON.parse(saved);

if (data.version !== CURRENT_VERSION) {
  // Migrate or reset
  return createInitialState(projectName);
}
```

2. **Gradual migration**:
```tsx
const migrateV1toV2 = (v1: any): LayerTreeState => {
  // Transform old structure to new
  return {
    nodes: transformNodes(v1.layers),
    rootIds: [v1.rootId]
  };
};
```

## Performance Considerations

### Write Frequency
- Saves on every tree change
- Could be optimized with debouncing:
```tsx
const debouncedSave = useMemo(
  () => debounce((tree) => {
    localStorage.setItem('layerTreeState', JSON.stringify(tree));
  }, 500),
  []
);

useEffect(() => {
  debouncedSave(tree);
}, [tree]);
```

### Read Performance
- Only reads once on mount (lazy initialization)
- No performance impact after initial load

## Security Considerations

- ✅ localStorage is origin-specific (safe from other domains)
- ✅ Data is client-side only (not sent to server)
- ⚠️ Data is not encrypted (don't store sensitive info)
- ⚠️ Accessible via browser DevTools
- ⚠️ Vulnerable to XSS attacks (sanitize user input)
