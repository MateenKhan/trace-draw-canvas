# Swipe Delete Fix for Mobile

## Problem
Swipe-left delete functionality was not working on mobile devices in the Layers Panel.

## Root Causes

1. **Immediate Reset**: The swipe position was reset to 0 immediately on pointer up, making the delete button invisible before users could tap it
2. **No Vertical Scroll Detection**: The swipe handler didn't distinguish between horizontal swipes and vertical scrolling
3. **Threshold Too High**: The -50px threshold was too strict for mobile touch interactions

## Solutions Implemented

### 1. Keep Swipe Open After Release ✅
**Changed behavior:**
- When user swipes left past -40px, the item stays swiped open at -80px
- Delete button remains visible for 3 seconds
- Auto-closes after 3 seconds if not clicked
- If swipe is less than -40px, closes immediately

**Code:**
```tsx
const handlePointerUp = (e: React.PointerEvent) => {
    // ...
    const delta = e.clientX - startX.current;
    if (delta < -40) {
        // Swiped Left far enough - keep it open
        setSwipeX(-80); // Fixed position showing delete
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            setSwipeX(0);
        }, 3000);
    } else {
        // Not swiped far enough - close immediately
        setSwipeX(0);
    }
};
```

### 2. Vertical Scroll Detection ✅
**Added Y-axis tracking:**
- Track both X and Y movement
- If vertical movement (deltaY) is greater than horizontal (deltaX), treat as scroll
- Cancel swipe and reset position
- Prevents accidental swipes while scrolling

**Code:**
```tsx
const handlePointerMove = (e: React.PointerEvent) => {
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - dragY.current;
    
    // If vertical movement is dominant, this is a scroll, not a swipe
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isSwiping.current = false;
        setSwipeX(0);
        // Cancel long press timer
        return;
    }
    
    // Continue with horizontal swipe logic...
};
```

### 3. Lower Threshold ✅
**Changed from -50px to -40px:**
- More forgiving for mobile touch
- Easier to trigger on smaller screens
- Still requires intentional swipe

### 4. Prevent Right Swipe ✅
**Only allow left swipe:**
```tsx
if (deltaX < 0 && Math.abs(deltaX) < 100) {
    setSwipeX(deltaX);
} else if (deltaX >= 0) {
    setSwipeX(0); // Reset if swiping right
}
```

## Files Modified

1. **`src/components/layers/LayerTreeItem.tsx`**
   - Added `dragY.current` for Y-axis tracking
   - Improved `handlePointerMove` with vertical scroll detection
   - Updated `handlePointerUp` to keep swipe open

2. **`src/components/layers/ShapeItem.tsx`**
   - Applied same fixes as LayerTreeItem
   - Consistent swipe behavior across all layer items

## User Experience

### Before Fix
1. User swipes left on mobile
2. Delete button appears briefly
3. Button disappears immediately on finger release
4. User can't tap the delete button
5. Frustration 😤

### After Fix
1. User swipes left on mobile (40px minimum)
2. Item slides to -80px position
3. Delete button stays visible for 3 seconds ✨
4. User can easily tap the delete button
5. Item auto-closes after 3 seconds if not tapped
6. Vertical scrolling doesn't trigger swipe 🎯

## Testing Checklist

- [x] Swipe left on mobile → Delete button appears
- [x] Delete button stays visible for 3 seconds
- [x] Can tap delete button while visible
- [x] Auto-closes after 3 seconds
- [x] Vertical scroll doesn't trigger swipe
- [x] Right swipe doesn't show delete
- [x] Works on both LayerTreeItem and ShapeItem
- [x] Drag handle doesn't trigger swipe
- [x] Button clicks don't trigger swipe

## Configuration

```tsx
// Swipe thresholds
const SWIPE_THRESHOLD = -40;      // Minimum swipe to trigger
const SWIPE_OPEN_POSITION = -80;  // Fixed open position
const AUTO_CLOSE_DELAY = 3000;    // 3 seconds
const MAX_SWIPE = 100;            // Maximum swipe distance
```

## Known Behaviors

1. **Long Press**: Holding for 600ms triggers rename (with vibration on supported devices)
2. **Drag Handle**: Swiping on the drag handle (GripVertical icon) won't trigger swipe delete
3. **Buttons**: Clicking buttons won't trigger swipe
4. **Multiple Items**: Each item manages its own swipe state independently

## Future Enhancements

1. **Swipe Right Actions**: Could add swipe-right for other actions (duplicate, move, etc.)
2. **Configurable Thresholds**: Allow users to adjust sensitivity
3. **Haptic Feedback**: Add more vibration feedback on successful swipe
4. **Visual Indicators**: Add subtle arrow or hint showing swipe is possible
5. **Undo**: Add undo option after delete
