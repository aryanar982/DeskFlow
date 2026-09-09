// Color manipulation utilities for DeskFlow dynamic themes and accents

export function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 120, b: 212 };
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) return { r: 0, g: 120, b: 212 };

  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = percent / 100;

  const newR = Math.min(255, Math.max(0, Math.round(r + (percent > 0 ? (255 - r) * factor : r * factor))));
  const newG = Math.min(255, Math.max(0, Math.round(g + (percent > 0 ? (255 - g) * factor : g * factor))));
  const newB = Math.min(255, Math.max(0, Math.round(b + (percent > 0 ? (255 - b) * factor : b * factor))));

  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

export function getAccentTokens(hex) {
  const { r, g, b } = hexToRgb(hex);
  return {
    primary: hex,
    hover: adjustBrightness(hex, 18),
    active: adjustBrightness(hex, -18),
    glow: `rgba(${r}, ${g}, ${b}, 0.42)`,
    soft: `rgba(${r}, ${g}, ${b}, 0.16)`,
  };
}
