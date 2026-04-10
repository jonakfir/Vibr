import { WebSocket } from 'ws';
import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { getProjectPath } from '../server';

interface WatchMessage {
  type: 'watch';
  path?: string;
}

const IGNORED_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.next/**',
  '**/dist/**',
  '**/.DS_Store',
];

export function handleWatchConnection(ws: WebSocket): void {
  let watcher: FSWatcher | null = null;

  function startWatching(watchPath: string): void {
    // Close existing watcher if any
    if (watcher) {
      watcher.close();
    }

    watcher = chokidar.watch(watchPath, {
      ignored: IGNORED_PATTERNS,
      persistent: true,
      ignoreInitial: true,
      depth: 5,
    });

    watcher.on('change', (filePath: string) => {
      sendEvent('change', filePath, watchPath);
    });

    watcher.on('add', (filePath: string) => {
      sendEvent('add', filePath, watchPath);
    });

    watcher.on('unlink', (filePath: string) => {
      sendEvent('unlink', filePath, watchPath);
    });
  }

  function sendEvent(type: string, filePath: string, basePath: string): void {
    try {
      const relativePath = path.relative(basePath, filePath);
      ws.send(
        JSON.stringify({
          type,
          path: relativePath,
        })
      );
    } catch {
      // WebSocket closed
    }
  }

  // Start watching project directory by default
  startWatching(getProjectPath());

  // Handle messages from client
  ws.on('message', (raw: Buffer) => {
    try {
      const msg: WatchMessage = JSON.parse(raw.toString());

      if (msg.type === 'watch' && msg.path) {
        const newPath = path.resolve(getProjectPath(), msg.path);
        startWatching(newPath);
      }
    } catch {
      // Ignore malformed messages
    }
  });

  // Cleanup on WebSocket close
  ws.on('close', () => {
    if (watcher) {
      watcher.close();
      watcher = null;
    }
  });

  ws.on('error', () => {
    if (watcher) {
      watcher.close();
      watcher = null;
    }
  });
}
