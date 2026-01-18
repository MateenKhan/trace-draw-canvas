import { FabricObject, IText } from 'fabric';

/**
 * Patches Fabric.js IText to support outline offsets (stroked text shifted relative to fill).
 * This allows "Text Outline Distance" feature.
 */
export const patchFabricIText = () => {
    if ((IText.prototype as any).__outlinePatchApplied) return;

    const originalRenderTextStroke = IText.prototype._renderTextStroke;

    IText.prototype._renderTextStroke = function (ctx: CanvasRenderingContext2D) {
        const dx = (this as any).outlineOffsetX || 0;
        const dy = (this as any).outlineOffsetY || 0;
        const gap = (this as any).outlineGap || 0;
        const gapColor = (this as any).outlineGapColor;

        if (dx !== 0 || dy !== 0) {
            ctx.save();
            ctx.translate(dx, dy);
        }

        if (gap > 0) {
            // 1. Draw Outer Stroke (Visible Outline)
            // Ensure we save the original stroke props
            const originalWidth = this.strokeWidth;
            const originalColor = this.stroke;

            // Draw the full band (Gap + Width)
            // We multiply by 2 because stroke is centered
            this.strokeWidth = originalWidth + gap * 2;
            this.stroke = originalColor; // Outline Color
            originalRenderTextStroke.call(this, ctx);

            // 2. Draw Inner Stroke (The Gap)
            // If PaintFirst is stroke (Behind), we need to 'clean' the gap area
            // But we can only paint on top.
            if (gapColor && gapColor !== 'transparent') {
                this.strokeWidth = gap * 2;
                this.stroke = gapColor;
                originalRenderTextStroke.call(this, ctx);
            }

            // Restore
            this.strokeWidth = originalWidth;
            this.stroke = originalColor;

        } else {
            originalRenderTextStroke.call(this, ctx);
        }

        if (dx !== 0 || dy !== 0) {
            ctx.restore();
        }
    };

    (IText.prototype as any).__outlinePatchApplied = true;
    console.log('Fabric IText patched for Outline Distance & Gap');
};

/**
 * Key for custom properties to include in JSON serialization
 */
export const CUSTOM_FABRIC_PROPS = [
    'outlineOffsetX',
    'outlineOffsetY',
    'outlineGap',
    'outlineGapColor',
    'outlineColor',
    'outlineWidth',
    'outlineBlur',
    'offsetColor',
    'offsetX',
    'offsetY',
    'offsetBlur',
    'paintFirst'
];
