// Stub vibr-local client - real implementation in iCloud
const BASE = "http://localhost:3001";

export async function checkConnection(): Promise<boolean> { return false; }
export async function getFiles(): Promise<FileNode[]> { return []; }
export async function readFile(path: string): Promise<string> { return ""; }
export async function openFolderPicker(): Promise<string> { return ""; }
export function connectTerminal(): WebSocket | null { return null; }
export function useVibrLocal() {
  return { connected: false, status: "disconnected" as const };
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export default useVibrLocal;
