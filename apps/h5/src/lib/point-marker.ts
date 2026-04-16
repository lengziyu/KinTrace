export type PointMarkerPresetKey = "star" | "lotus" | "mountain" | "leaf";

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildSvg(preset: PointMarkerPresetKey) {
  const shell = "#2563eb";
  const accent = "#f8fafc";

  switch (preset) {
    case "lotus":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="4" y="4" width="64" height="64" rx="18" fill="${shell}"/><path d="M36 18c2 6 6 10 12 13-3 8-7 12-12 14-5-2-9-6-12-14 6-3 10-7 12-13Z" fill="${accent}"/><path d="M22 37c5 1 9 4 14 9-8 2-13 1-18-2 1-3 2-5 4-7Zm28 9c5-5 9-8 14-9 2 2 3 4 4 7-5 3-10 4-18 2Z" fill="${accent}" opacity=".88"/><path d="M26 52h20" stroke="${accent}" stroke-width="4" stroke-linecap="round"/></svg>`;
    case "mountain":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="4" y="4" width="64" height="64" rx="18" fill="${shell}"/><path d="M18 49 30 29l8 12 6-8 10 16H18Z" fill="${accent}"/><path d="M29 31l3-5 4 6" stroke="${shell}" stroke-width="3" stroke-linecap="round"/><path d="M22 55h28" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".9"/></svg>`;
    case "leaf":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="4" y="4" width="64" height="64" rx="18" fill="${shell}"/><path d="M50 22c-2 18-10 28-24 32-3-16 5-30 24-32Z" fill="${accent}"/><path d="M29 48c8-5 14-12 18-22" stroke="${shell}" stroke-width="3" stroke-linecap="round"/><path d="M24 55h24" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".9"/></svg>`;
    case "star":
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="4" y="4" width="64" height="64" rx="18" fill="${shell}"/><path d="m36 18 5.6 11.4L54 31.2l-9 8.8L47.2 53 36 47.1 24.8 53 27 40l-9-8.8 12.4-1.8L36 18Z" fill="${accent}"/><path d="M24 56h24" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".9"/></svg>`;
  }
}

export function getPointMarkerIcon(preset: PointMarkerPresetKey, customUrl?: string) {
  return customUrl || svgToDataUri(buildSvg(preset));
}
