"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWatchConnection = handleWatchConnection;
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = __importDefault(require("path"));
const server_1 = require("../server");
const IGNORED_PATTERNS = [
    '**/node_modules/**',
    '**/.git/**',
    '**/.next/**',
    '**/dist/**',
    '**/.DS_Store',
];
function handleWatchConnection(ws) {
    let watcher = null;
    function startWatching(watchPath) {
        // Close existing watcher if any
        if (watcher) {
            watcher.close();
        }
        watcher = chokidar_1.default.watch(watchPath, {
            ignored: IGNORED_PATTERNS,
            persistent: true,
            ignoreInitial: true,
            depth: 5,
        });
        watcher.on('change', (filePath) => {
            sendEvent('change', filePath, watchPath);
        });
        watcher.on('add', (filePath) => {
            sendEvent('add', filePath, watchPath);
        });
        watcher.on('unlink', (filePath) => {
            sendEvent('unlink', filePath, watchPath);
        });
    }
    function sendEvent(type, filePath, basePath) {
        try {
            const relativePath = path_1.default.relative(basePath, filePath);
            ws.send(JSON.stringify({
                type,
                path: relativePath,
            }));
        }
        catch {
            // WebSocket closed
        }
    }
    // Start watching project directory by default
    startWatching((0, server_1.getProjectPath)());
    // Handle messages from client
    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'watch' && msg.path) {
                const newPath = path_1.default.resolve((0, server_1.getProjectPath)(), msg.path);
                startWatching(newPath);
            }
        }
        catch {
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
//# sourceMappingURL=watch.js.map