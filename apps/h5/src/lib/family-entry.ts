const DEFAULT_H5_BASE_URL = "http://localhost:5173";

export type FamilyEntryQuery = {
  familyId?: string;
  familyCode?: string;
  inviteCode?: string;
};

function sanitizeValue(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function readFamilyEntryQuery(search = window.location.search): FamilyEntryQuery {
  const params = new URLSearchParams(search);

  return {
    familyId: sanitizeValue(params.get("familyId")),
    familyCode: sanitizeValue(params.get("familyCode")),
    inviteCode: sanitizeValue(params.get("inviteCode")),
  };
}

export function getH5BaseUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return DEFAULT_H5_BASE_URL;
}

function buildUrl(path: string, key: "familyCode" | "inviteCode", value: string, baseUrl = getH5BaseUrl()) {
  const url = new URL(path, `${baseUrl.replace(/\/$/, "")}/`);
  url.searchParams.set(key, value);
  return url.toString();
}

export function buildFamilyLoginUrl(familyCode: string, baseUrl?: string) {
  return buildUrl("/login", "familyCode", familyCode, baseUrl);
}

export function buildFamilyJoinUrl(inviteCode: string, baseUrl?: string) {
  return buildUrl("/join", "inviteCode", inviteCode, baseUrl);
}
