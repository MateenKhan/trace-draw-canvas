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
  fontFamily: 'Inter',
  fontSize: 24,
  fontWeight: 400,
  fontStyle: 'normal',
  textAlign: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: '#ffffff',
};

export const DEFAULT_IMAGE_FILTER: ImageFilter = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
};
