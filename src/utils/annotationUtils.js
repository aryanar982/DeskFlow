// Utility functions for rendering annotations (Pen, Highlighter & Eraser strokes) on Canvas & PDF exports

export const ANNOTATION_COLORS = [
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
];

export const PEN_SIZES = [
  { label: 'Thin', value: 3 },
  { label: 'Medium', value: 7 },
  { label: 'Thick', value: 14 },
];

export const HIGHLIGHTER_SIZES = [
  { label: 'Thin', value: 14 },
  { label: 'Medium', value: 24 },
  { label: 'Thick', value: 40 },
];

export const ERASER_SIZES = [
  { label: 'Small', value: 12 },
  { label: 'Medium', value: 24 },
  { label: 'Large', value: 48 },
];

export const OPACITY_OPTIONS = [
  { label: '20%', value: 0.2 },
  { label: '40%', value: 0.4 },
  { label: '60%', value: 0.6 },
  { label: '80%', value: 0.8 },
];

/**
 * Draw a single stroke object on a canvas 2D context.
 * Supports smooth quadratic curves between points and translucent highlighter opacity.
 */
export function drawStroke(ctx, stroke) {
  if (!stroke || !stroke.points || stroke.points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.size || 5;

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else if (stroke.tool === 'highlighter') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 0.4;
    ctx.strokeStyle = stroke.color || '#F59E0B';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 1.0;
    ctx.strokeStyle = stroke.color || '#EF4444';
  }

  const points = stroke.points;
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, (stroke.size || 5) / 2, 0, Math.PI * 2);
    if (stroke.tool === 'eraser') {
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.fillStyle = stroke.color || (stroke.tool === 'highlighter' ? '#F59E0B' : '#EF4444');
    }
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // For the final point
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Render all strokes onto a given canvas 2D context.
 * Clears context first if specified.
 */
export function renderStrokesOnContext(ctx, width, height, strokes, currentStroke = null, clear = true) {
  if (clear) {
    ctx.clearRect(0, 0, width, height);
  }

  if (Array.isArray(strokes)) {
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });
  }

  if (currentStroke) {
    drawStroke(ctx, currentStroke);
  }
}

/**
 * Asynchronously composite original screenshot image + user annotations into a single PNG Data URL.
 * Used for PDF exports & persistent thumbnail rendering without mutating original base64.
 */
export function renderCompositePage(page) {
  return new Promise((resolve) => {
    if (!page || !page.dataUrl) {
      resolve(page ? page.dataUrl : null);
      return;
    }

    if (!Array.isArray(page.strokes) || page.strokes.length === 0) {
      resolve(page.dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const targetWidth = img.naturalWidth || page.width || 1920;
      const targetHeight = img.naturalHeight || page.height || 1080;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // 1. Draw base screenshot image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 2. Draw annotations on top
      renderStrokesOnContext(ctx, targetWidth, targetHeight, page.strokes, null, false);

      // 3. Return high-res composite Data URL
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      resolve(page.dataUrl);
    };
    img.src = page.dataUrl;
  });
}
