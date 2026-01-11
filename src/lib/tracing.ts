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

// Simple edge detection and path tracing algorithm
export const traceImageToSVG = async (
  imageData: ImageData,
  settings: TraceSettings
): Promise<string> => {
  const { width, height, data } = imageData;
  const { threshold, blackOnWhite, color, strokeWidth, turdSize } = settings;

  // Convert to grayscale and threshold
  const binaryData: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    binaryData[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const alpha = data[idx + 3];
      
      // Consider alpha channel
      if (alpha < 128) {
        binaryData[y][x] = blackOnWhite;
      } else {
        binaryData[y][x] = blackOnWhite ? gray < threshold : gray >= threshold;
      }
    }
  }

  // Find contours using marching squares
  const contours = findContours(binaryData, width, height, turdSize);

  // Generate SVG
  let pathD = "";
  for (const contour of contours) {
    if (contour.length < 3) continue;
    
    // Simplify path
    const simplified = douglasPeucker(contour, settings.optTolerance * 2);
    
    pathD += `M ${simplified[0].x} ${simplified[0].y} `;
    for (let i = 1; i < simplified.length; i++) {
      pathD += `L ${simplified[i].x} ${simplified[i].y} `;
    }
    pathD += "Z ";
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <path d="${pathD}" fill="${settings.fillColor}" stroke="${color}" stroke-width="${strokeWidth}" />
  </svg>`;
};

interface Point {
  x: number;
  y: number;
}

// Marching squares algorithm to find contours
function findContours(
  binary: boolean[][],
  width: number,
  height: number,
  minSize: number
): Point[][] {
  const visited = new Set<string>();
  const contours: Point[][] = [];

  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      // Check for edge
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
  let dir = 0; // 0: right, 1: down, 2: left, 3: up

  const maxSteps = width * height;
  let steps = 0;

  do {
    if (steps++ > maxSteps) break;

    const key = `${x},${y}`;
    visited.add(key);
    contour.push({ x: x + 0.5, y: y + 0.5 });

    // Get cell type
    const tl = binary[y]?.[x] ?? false;
    const tr = binary[y]?.[x + 1] ?? false;
    const bl = binary[y + 1]?.[x] ?? false;
    const br = binary[y + 1]?.[x + 1] ?? false;
    const cellType = (tl ? 8 : 0) + (tr ? 4 : 0) + (br ? 2 : 0) + (bl ? 1 : 0);

    // Determine next direction based on cell type
    const nextDir = getNextDirection(cellType, dir);
    dir = nextDir;

    // Move to next cell
    switch (dir) {
      case 0: x++; break;
      case 1: y++; break;
      case 2: x--; break;
      case 3: y--; break;
    }

    // Bounds check
    if (x < 0 || x >= width - 1 || y < 0 || y >= height - 1) break;

  } while (!(x === startX && y === startY) && contour.length < 10000);

  return contour;
}

function getNextDirection(cellType: number, currentDir: number): number {
  // Simplified marching squares lookup
  const directions: { [key: number]: number } = {
    1: 3, 2: 0, 3: 0, 4: 1, 5: 3, 6: 1, 7: 0,
    8: 2, 9: 2, 10: 1, 11: 2, 12: 1, 13: 3, 14: 1,
  };
  
  return directions[cellType] ?? currentDir;
}

// Douglas-Peucker line simplification
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
