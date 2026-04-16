import type { TombPoint } from "@kintrace/shared";
import { resolveAssetUrl } from "./http";

function encodeSvg(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function pickPalette(seed: string) {
  const palettes = [
    { top: "#6f5b3e", bottom: "#e9dcc4", accent: "#94a89c", line: "#efe7d9" },
    { top: "#4a5c55", bottom: "#ebe4d6", accent: "#b8925f", line: "#f5efe5" },
    { top: "#5f4e43", bottom: "#efe2cf", accent: "#7e9b90", line: "#f8f1e8" },
  ];

  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[total % palettes.length];
}

export function getTombCoverUrl(tomb: Pick<TombPoint, "id" | "name" | "titleName" | "branchName" | "generation" | "coverImage">) {
  if (tomb.coverImage) {
    return resolveAssetUrl(tomb.coverImage);
  }

  const palette = pickPalette(tomb.id || tomb.name);
  const title = tomb.titleName || tomb.name;
  const subtitle = [tomb.generation, tomb.branchName].filter(Boolean).join(" · ") || "KinTrace";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.top}" />
        <stop offset="100%" stop-color="${palette.bottom}" />
      </linearGradient>
      <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.line}" stop-opacity="0.26" />
        <stop offset="100%" stop-color="${palette.line}" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="720" height="420" rx="36" fill="url(#bg)" />
    <circle cx="585" cy="84" r="54" fill="${palette.line}" fill-opacity="0.22" />
    <path d="M0 280 C110 240 160 222 240 242 C330 266 376 314 470 300 C560 286 608 228 720 214 L720 420 L0 420 Z" fill="${palette.accent}" fill-opacity="0.26" />
    <path d="M0 310 C110 286 174 298 248 322 C320 344 395 354 488 330 C580 306 650 314 720 336 L720 420 L0 420 Z" fill="${palette.top}" fill-opacity="0.34" />
    <rect x="38" y="38" width="644" height="344" rx="28" fill="none" stroke="${palette.line}" stroke-opacity="0.22" />
    <path d="M56 76 H664" stroke="${palette.line}" stroke-opacity="0.18" />
    <g transform="translate(74 126)">
      <text x="0" y="0" fill="#f9f4ed" font-size="16" font-family="'Noto Serif SC','Source Han Serif SC',serif" letter-spacing="6">KINTRACE</text>
      <text x="0" y="92" fill="#fff8ef" font-size="52" font-family="'Noto Serif SC','Source Han Serif SC',serif" font-weight="700">${title}</text>
      <text x="0" y="136" fill="#f3ebdf" font-size="20" font-family="'Noto Serif SC','Source Han Serif SC',serif">${subtitle}</text>
    </g>
    <rect x="0" y="0" width="720" height="420" fill="url(#fog)" />
  </svg>`;

  return encodeSvg(svg);
}
