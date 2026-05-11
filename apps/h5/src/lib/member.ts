function trimName(value?: string | null) {
  return value?.trim() || "";
}

export function getMemberMonogram(name?: string | null, fallback = "访客") {
  const normalized = trimName(name) || fallback;
  const characters = Array.from(normalized);

  return characters.slice(-2).join("");
}
