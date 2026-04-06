const VIBR_LOCAL_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_VIBR_LOCAL_URL ?? "http://localhost:47821")
    : "http://localhost:47821";

const WS_URL = VIBR_LOCAL_URL.replace(/^http/, "ws");

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

async function safeFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(`${VIBR_LOCAL_URL}${path}`, {
      ...options,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function checkConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${VIBR_LOCAL_URL}/api/status`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getFiles(path?: string): Promise<FileNode[] | null> {
  const query = path ? `?path=${encodeURIComponent(path)}` : "";
  return safeFetch<FileNode[]>(`/api/files${query}`);
}

export async function readFile(path: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${VIBR_LOCAL_URL}/api/files/read?path=${encodeURIComponent(path)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function writeFile(
  path: string,
  content: string
): Promise<boolean> {
  try {
    const res = await fetch(`${VIBR_LOCAL_URL}/api/files/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function openFolderPicker(): Promise<string | null> {
  const result = await safeFetch<{ path: string }>("/api/folder-picker", {
    method: "POST",
  });
  return result?.path ?? null;
}

export function connectTerminal(): WebSocket | null {
  try {
    return new WebSocket(`${WS_URL}/terminal`);
  } catch {
    return null;
  }
}

export function connectFileWatcher(path: string): WebSocket | null {
  try {
    return new WebSocket(
      `${WS_URL}/watch?path=${encodeURIComponent(path)}`
    );
  } catch {
    return null;
  }
}
