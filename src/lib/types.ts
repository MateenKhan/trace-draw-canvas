// Tool types for the canvas editor
export type DrawingTool =
  | 'select'
  | 'pan'
  | 'pen'
  | 'pencil'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'text'
  | 'spline'
  | 'crop'
  | 'transform';

export interface ToolConfig {
  id: DrawingTool;
  label: string;
  icon: string;
  group: 'navigation' | 'drawing' | 'shapes' | 'text' | 'image';
}

export interface StrokeStyle {
  color: string;
  width: number;
  dashArray?: number[];
}

export interface FillStyle {
  color: string;
  opacity: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  glowColor?: string;
  glowBlur?: number;
  glowWidth?: number;
  content?: string;
  offsetColor?: string;
  offsetX?: number;
  offsetY?: number;
  offsetBlur?: number;
  outlineColor?: string;
  outlineWidth?: number;
  outlineBlur?: number;
  outlineOffsetX?: number;
  outlineOffsetY?: number;
  outlineGap?: number;
  outlineGapColor?: string;
  paintFirst?: 'fill' | 'stroke';
}

export interface ImageFilter {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'Lato', value: 'Lato' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Oswald', value: 'Oswald' },
  { name: 'Playfair Display', value: 'Playfair Display' },
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'Poppins', value: 'Poppins' },
  { name: 'Raleway', value: 'Raleway' },
  { name: 'Source Sans 3', value: 'Source Sans 3' },
  { name: 'Nunito', value: 'Nunito' },
  { name: 'Ubuntu', value: 'Ubuntu' },
  { name: 'Quicksand', value: 'Quicksand' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono' },
  { name: 'Andalucia', value: 'Andalucia' },
  { name: 'Great Vibes', value: 'Great Vibes' },
] as const;

export const DEFAULT_STROKE: StrokeStyle = {
  color: '#00d4ff',
  width: 2,
};

export const DEFAULT_FILL: FillStyle = {
  color: 'transparent',
  opacity: 1,
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Great Vibes',
  fontSize: 24,
  fontWeight: 400,
  fontStyle: 'normal',
  textAlign: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: '#00d4ff',
  glowColor: '#00d4ff',
  glowBlur: 0,
  content: 'New Text',
  offsetColor: '#000000',
  offsetX: 0,
  offsetY: 0,
  offsetBlur: 0,
  outlineColor: '#000000',
  outlineWidth: 0,
  outlineBlur: 0,
  outlineOffsetX: 0,
  outlineOffsetY: 0,
  outlineGap: 0,
  outlineGapColor: 'transparent',
  paintFirst: 'stroke',
};

export const DEFAULT_IMAGE_FILTER: ImageFilter = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
};

export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
  sub?: string;
}


export type CanvasUnit = 'px' | 'in' | 'mm' | 'cm' | 'ft';

export const UNIT_CONVERTERS: Record<CanvasUnit, number> = {
  px: 1,
  in: 96,
  mm: 3.77952755906,
  cm: 37.7952755906,
  ft: 1152, // 12 * 96
};

export const CANVAS_PRESETS: CanvasPreset[] = [
  { name: '800x600', width: 800, height: 600 },
  { name: '10" Square', width: 960, height: 960 },
  { name: 'A4', width: 794, height: 1123, sub: '210x297mm' },
  { name: 'A3', width: 1123, height: 1587, sub: '297x420mm' },
  { name: 'A5', width: 559, height: 794, sub: '148x210mm' },
  { name: 'Letter', width: 816, height: 1056, sub: '8.5x11in' },
  { name: 'Legal', width: 816, height: 1344, sub: '8.5x14in' },
  { name: '720p', width: 1280, height: 720 },
  { name: '1080p', width: 1920, height: 1080 },
  { name: '4K', width: 3840, height: 2160 },
  { name: 'Instagram', width: 1080, height: 1080 },
] as const;


