/**
 * vibr-local — browser-only file access for the IDE.
 *
 * Originally this was a thin wrapper around a `vibr-local` CLI running
 * on http://localhost:3001. That CLI doesn't ship in this repo, so the
 * "Open folder" button never did anything. We replaced it with the
 * native File System Access API (window.showDirectoryPicker), which is
 * supported in Chromium-based browsers and gives the user direct
 * sandboxed access to a folder on their machine.
 *
 * The dirHandle is kept in module-level state so other functions
 * (getFiles, readFile) can walk it after the user picks a folder.
 *
 * If the API isn't available (Firefox, older Safari), every call
 * returns a safe empty value and the UI shows "Disconnected".
 */

import { useEffect, useState } from "react";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

// We avoid pulling in DOM lib types for FileSystemDirectoryHandle so
// this still compiles in older TS configs. The runtime API is the
// real one — these aliases just keep the compiler happy.
type DirHandle = {
  kind: "directory";
  name: string;
  values: () => AsyncIterableIterator<DirHandle | FileHandle>;
  getDirectoryHandle: (name: string) => Promise<DirHandle>;
  getFileHandle: (name: string) => Promise<FileHandle>;
};
type FileHandle = {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
};

let rootHandle: DirHandle | null = null;
let rootName: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

function isFsApiSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker === "function"
  );
}

// Directories we never want to walk into. Walking node_modules or .git
// will hang the UI on real projects.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".cache",
  ".vercel",
  ".DS_Store",
]);

/** True after the user has picked a folder. */
export async function checkConnection(): Promise<boolean> {
  return rootHandle !== null;
}

/** Open the native folder picker and remember the chosen handle. */
export async function openFolderPicker(): Promise<string> {
  if (!isFsApiSupported()) {
    throw new Error(
      "Your browser doesn't support the File System Access API. Use Chrome, Edge, or Brave."
    );
  }
  try {
    const handle = (await (
      window as unknown as {
        showDirectoryPicker: (opts?: {
          mode?: "read" | "readwrite";
        }) => Promise<DirHandle>;
      }
    ).showDirectoryPicker({ mode: "read" })) as DirHandle;
    rootHandle = handle;
    rootName = handle.name;
    notify();
    return handle.name;
  } catch (err) {
    // User cancelled or denied — leave state untouched.
    if (err instanceof Error && err.name === "AbortError") {
      return rootName ?? "";
    }
    throw err;
  }
}

/** Walk the picked folder and return a tree (max depth 6). */
export async function getFiles(): Promise<FileNode[]> {
  if (!rootHandle) return [];
  try {
    return await walk(rootHandle, "", 0);
  } catch {
    return [];
  }
}

async function walk(
  dir: DirHandle,
  parentPath: string,
  depth: number
): Promise<FileNode[]> {
  const out: FileNode[] = [];
  if (depth > 6) return out;
  for await (const entry of dir.values()) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    if (entry.kind === "directory") {
      out.push({
        name: entry.name,
        path,
        type: "directory",
        // Lazy children — we walk one level deep here, deeper levels
        // are walked on-demand by the FileTree component if it asks.
        // For now we eagerly walk to keep the UI simple.
        children: await walk(entry as DirHandle, path, depth + 1),
      });
    } else {
      out.push({ name: entry.name, path, type: "file" });
    }
  }
  // directories first, then files, both alphabetical
  out.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return out;
}

/** Read a file by its slash-joined path relative to the picked folder. */
export async function readFile(path: string): Promise<string> {
  if (!rootHandle) return "";
  try {
    const segments = path.split("/").filter(Boolean);
    let dir: DirHandle = rootHandle;
    for (let i = 0; i < segments.length - 1; i++) {
      dir = await dir.getDirectoryHandle(segments[i]);
    }
    const fileHandle = await dir.getFileHandle(segments[segments.length - 1]);
    const file = await fileHandle.getFile();
    // Cap at 256 KB so we don't blow up the modal on huge binaries.
    if (file.size > 256 * 1024) {
      const slice = file.slice(0, 256 * 1024);
      return (
        (await slice.text()) +
        `\n\n--- truncated (${(file.size / 1024).toFixed(0)} KB total) ---`
      );
    }
    return await file.text();
  } catch (err) {
    return `// could not read ${path}: ${
      err instanceof Error ? err.message : "unknown error"
    }`;
  }
}

/** Terminal websocket — not supported in browser-only mode. */
export function connectTerminal(): WebSocket | null {
  return null;
}

/** React hook surface for components that want live status. */
export function useVibrLocal() {
  const [connected, setConnected] = useState<boolean>(rootHandle !== null);
  const [folderName, setFolderName] = useState<string | null>(rootName);

  useEffect(() => {
    const fn = () => {
      setConnected(rootHandle !== null);
      setFolderName(rootName);
    };
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return {
    connected,
    folderName,
    status: connected ? ("connected" as const) : ("disconnected" as const),
  };
}

export default useVibrLocal;
