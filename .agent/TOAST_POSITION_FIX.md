# Toast Notification Position Fix

## Problem
Toast notifications were appearing at the bottom of the screen, directly overlapping with the bottom toolbar, making them hard to read and annoying for users.

## Solution
Adjusted the Sonner toast component configuration to position notifications above the bottom toolbar.

## Changes Made

**File:** `src/components/ui/sonner.tsx`

**Added props:**
```tsx
<Sonner
  theme={theme as ToasterProps["theme"]}
  className="toaster group"
  position="bottom-center"      // ← Position at bottom center
  offset="100px"                 // ← Offset 100px from bottom
  toastOptions={{...}}
  {...props}
/>
```

## Configuration

- **Position**: `bottom-center` - Toasts appear centered at the bottom
- **Offset**: `100px` - Pushes toasts 100px up from the bottom edge
- **Result**: Toasts now appear above the bottom toolbar

## Visual Impact

### Before
```
┌─────────────────────┐
│                     │
│   Canvas Area       │
│                     │
├─────────────────────┤ ← Toast appears here (overlapping toolbar)
│  Bottom Toolbar     │
└─────────────────────┘
```

### After
```
┌─────────────────────┐
│                     │
│   Canvas Area       │
│                     │
│  [Toast Message]    │ ← Toast appears here (above toolbar)
├─────────────────────┤
│  Bottom Toolbar     │
└─────────────────────┘
```

## Alternative Positions

If you want to change the position, Sonner supports:

- `top-left`
- `top-center`
- `top-right`
- `bottom-left`
- `bottom-center` ← Current
- `bottom-right`

## Offset Adjustment

The `100px` offset can be adjusted based on toolbar height:

```tsx
offset="80px"   // Smaller offset (closer to toolbar)
offset="120px"  // Larger offset (further from toolbar)
```

## Testing

1. Create a new project → Toast appears
2. Delete a layer → Toast appears
3. Verify toast is above the bottom toolbar
4. Verify toast doesn't overlap toolbar buttons

## Related Files

- `src/components/ui/sonner.tsx` - Toast configuration
- `src/App.tsx` - Toaster component usage
- All components using `toast()` from `sonner`

## Toast Usage Examples

```tsx
import { toast } from "sonner";

// Success
toast.success("Project created");

// Error
toast.error("Failed to delete");

// Info
toast.info("Layer renamed");

// Warning
toast.warning("Unsaved changes");

// Custom
toast("Custom message", {
  description: "Additional details",
  action: {
    label: "Undo",
    onClick: () => console.log("Undo"),
  },
});
```

## Future Enhancements

1. **Dynamic Offset**: Calculate offset based on actual toolbar height
2. **Mobile Adjustments**: Different offset for mobile devices
3. **Toast Queue**: Limit number of visible toasts
4. **Custom Styling**: Match toast design with app theme more closely
