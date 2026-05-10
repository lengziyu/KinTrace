import type { TombPoint } from "@kintrace/shared";
import { resolveAssetUrl } from "./http";

type CoverTomb = Pick<
  TombPoint,
  "id" | "name" | "titleName" | "branchName" | "generation" | "areaName" | "coverImage"
>;

const palettes = [
  {
    start: "#5f5647",
    end: "#e9ddc7",
    wave: "#93a59a",
    glow: "rgba(255, 246, 232, 0.26)",
    line: "rgba(255, 248, 239, 0.24)",
  },
  {
    start: "#46595a",
    end: "#e7dfd0",
    wave: "#bd9765",
    glow: "rgba(244, 250, 255, 0.2)",
    line: "rgba(250, 245, 236, 0.22)",
  },
  {
    start: "#6a5248",
    end: "#ede1d4",
    wave: "#7b988d",
    glow: "rgba(255, 244, 232, 0.24)",
    line: "rgba(251, 245, 237, 0.22)",
  },
];

function pickPalette(seed: string) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[total % palettes.length];
}

export function getTombCoverImageUrl(tomb: CoverTomb) {
  if (!tomb.coverImage) {
    return "";
  }

  return resolveAssetUrl(tomb.coverImage);
}

export function getTombCoverPalette(tomb: CoverTomb) {
  return pickPalette(tomb.name || tomb.id);
}

export function getTombCoverTitle(tomb: CoverTomb) {
  return tomb.name;
}

export function getTombCoverSubtitle(tomb: CoverTomb) {
  return [tomb.titleName, tomb.branchName || tomb.areaName, tomb.generation]
    .filter(Boolean)
    .join(" · ") || "家族墓点";
}
