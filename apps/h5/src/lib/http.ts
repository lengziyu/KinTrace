import type { ApiResponse } from "@kintrace/shared";

const DEFAULT_API_BASE_URL = "http://localhost:3000/api/v1";

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

export function getApiOrigin() {
  return new URL(getApiBaseUrl()).origin;
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path) || path.startsWith("data:")) {
    return path;
  }

  return new URL(path, `${getApiOrigin()}/`).toString();
}

export class HttpError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function httpRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(joinUrl(getApiBaseUrl(), path), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json()) as ApiResponse<T> | { message?: string };

  if (!response.ok) {
    throw new HttpError("message" in payload && payload.message ? payload.message : "请求失败", response.status);
  }

  if (!("data" in payload)) {
    throw new HttpError("响应格式不正确", response.status);
  }

  return payload.data;
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(joinUrl(getApiBaseUrl(), "uploads/images"), {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as
    | ApiResponse<{
        fileName: string;
        originalName: string;
        size: number;
        mimeType: string;
        url: string;
      }>
    | { message?: string };

  if (!response.ok) {
    throw new HttpError("message" in payload && payload.message ? payload.message : "图片上传失败", response.status);
  }

  if (!("data" in payload)) {
    throw new HttpError("上传响应格式不正确", response.status);
  }

  return payload.data;
}
