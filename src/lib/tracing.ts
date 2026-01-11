import { loadFromCanvas } from "potrace-wasm";

export interface TraceSettings {
  threshold: number;
  turdSize: number;
  alphaMax: number;
  optCurve: boolean;
  optTolerance: number;
  turnPolicy: "black" | "white" | "left" | "right" | "minority" | "majority";
  blackOnWhite: boolean;
  color: string;
  fillColor: string;
  strokeWidth: number;
}

export const defaultTraceSettings: TraceSettings = {
  threshold: 128,
  turdSize: 2,
  alphaMax: 1,
  optCurve: true,
  optTolerance: 0.2,
  turnPolicy: "minority",
  blackOnWhite: true,
  color: "#00d4ff",
  fillColor: "transparent",
  strokeWidth: 1,
};

// Use potrace-wasm for high-quality tracing
export const traceImageToSVG = async (
  imageData: ImageData,
  settings: TraceSettings
): Promise<string> => {
  const { width, height, data } = imageData;
  const { threshold, blackOnWhite, color, strokeWidth, fillColor } = settings;

  // Create a canvas from imageData for potrace
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Pre-process image: convert to binary based on threshold
  const processedData = new ImageData(width, height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Calculate grayscale
    const gray = (r + g + b) / 3;
    
    // Apply threshold
    let isBlack: boolean;
    if (a < 128) {
      // Transparent pixels
      isBlack = !blackOnWhite;
    } else {
      isBlack = blackOnWhite ? gray < threshold : gray >= threshold;
    }
    
    // Set pixel to black or white
    const value = isBlack ? 0 : 255;
    processedData.data[i] = value;
    processedData.data[i + 1] = value;
    processedData.data[i + 2] = value;
    processedData.data[i + 3] = 255;
  }

  ctx.putImageData(processedData, 0, 0);

  try {
    // Use potrace-wasm for tracing
    const svg = await loadFromCanvas(tempCanvas);
    
    // Parse and modify the SVG to apply our custom styles
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    const paths = Array.from(doc.querySelectorAll("path"));

    // If potrace returns an empty SVG, fall back to our custom implementation.
    if (!svgElement || paths.length === 0) {
      throw new Error("No paths traced by potrace");
    }

    // Make the SVG responsive so it can be scaled by the container
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

    paths.forEach((path) => {
      // Some outputs may include empty paths; skip them.
      if (!path.getAttribute("d")) return;
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", String(strokeWidth));
      path.setAttribute("fill", fillColor);
    });

    const serializer = new XMLSerializer();
    // Serialize the <svg> node only (more reliable for innerHTML rendering)
    return serializer.serializeToString(svgElement);
  } catch (error) {
    console.error("Potrace-wasm failed, using fallback:", error);
    // Fallback to custom implementation
    return fallbackTrace(processedData, settings);
  }
};

// Fallback implementation if potrace-wasm fails
async function fallbackTrace(
  imageData: ImageData,
  settings: TraceSettings
): Promise<string> {
  const { width, height, data } = imageData;
  const { color, strokeWidth, fillColor, turdSize } = settings;

  // Convert to binary
  const binary: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    binary[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      binary[y][x] = data[idx] < 128;
    }
  }

  // Find contours
  const contours = findContours(binary, width, height, turdSize);

  // Generate SVG path
  let pathD = "";
  for (const contour of contours) {
    if (contour.length < 3) continue;
    
    const simplified = douglasPeucker(contour, settings.optTolerance * 2);
    
    pathD += `M ${simplified[0].x.toFixed(1)} ${simplified[0].y.toFixed(1)} `;
    for (let i = 1; i < simplified.length; i++) {
      pathD += `L ${simplified[i].x.toFixed(1)} ${simplified[i].y.toFixed(1)} `;
    }
    pathD += "Z ";
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <path d="${pathD}" fill="${fillColor}" stroke="${color}" stroke-width="${strokeWidth}" />
  </svg>`;
}

interface Point {
  x: number;
  y: number;
}

function findContours(
  binary: boolean[][],
  width: number,
  height: number,
  minSize: number
): Point[][] {
  const visited = new Set<string>();
  const contours: Point[][] = [];
  const maxContours = 500;

  for (let y = 0; y < height - 1 && contours.length < maxContours; y++) {
    for (let x = 0; x < width - 1 && contours.length < maxContours; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      const tl = binary[y]?.[x] ?? false;
      const tr = binary[y]?.[x + 1] ?? false;
      const bl = binary[y + 1]?.[x] ?? false;
      const br = binary[y + 1]?.[x + 1] ?? false;

      const cellType = (tl ? 8 : 0) + (tr ? 4 : 0) + (br ? 2 : 0) + (bl ? 1 : 0);

      if (cellType > 0 && cellType < 15) {
        const contour = traceContour(binary, x, y, width, height, visited);
        if (contour.length >= minSize * 3) {
          contours.push(contour);
        }
      }
    }
  }

  return contours;
}

function traceContour(
  binary: boolean[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  visited: Set<string>
): Point[] {
  const contour: Point[] = [];
  let x = startX;
  let y = startY;
  let dir = 0;

  const maxSteps = Math.min(width * height, 5000);
  let steps = 0;

  do {
    if (steps++ > maxSteps) break;

    const key = `${x},${y}`;
    visited.add(key);
    contour.push({ x: x + 0.5, y: y + 0.5 });

    const tl = binary[y]?.[x] ?? false;
    const tr = binary[y]?.[x + 1] ?? false;
    const bl = binary[y + 1]?.[x] ?? false;
    const br = binary[y + 1]?.[x + 1] ?? false;
    const cellType = (tl ? 8 : 0) + (tr ? 4 : 0) + (br ? 2 : 0) + (bl ? 1 : 0);

    const nextDir = getNextDirection(cellType, dir);
    dir = nextDir;

    switch (dir) {
      case 0: x++; break;
      case 1: y++; break;
      case 2: x--; break;
      case 3: y--; break;
    }

    if (x < 0 || x >= width - 1 || y < 0 || y >= height - 1) break;

  } while (!(x === startX && y === startY) && contour.length < 5000);

  return contour;
}

function getNextDirection(cellType: number, currentDir: number): number {
  const directions: { [key: number]: number } = {
    1: 3, 2: 0, 3: 0, 4: 1, 5: 3, 6: 1, 7: 0,
    8: 2, 9: 2, 10: 1, 11: 2, 12: 1, 13: 3, 14: 1,
  };
  
  return directions[cellType] ?? currentDir;
}

function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);

  if (mag === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);

  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  const closestX = lineStart.x + u * dx;
  const closestY = lineStart.y + u * dy;

  return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
}
