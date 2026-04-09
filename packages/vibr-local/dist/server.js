"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectPath = getProjectPath;
exports.setProjectPath = setProjectPath;
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const auth_1 = require("./auth");
const status_1 = require("./routes/status");
const files_1 = require("./routes/files");
const git_1 = require("./routes/git");
const folder_picker_1 = require("./routes/folder-picker");
const terminal_1 = require("./routes/terminal");
const watch_1 = require("./routes/watch");
let projectPath = process.cwd();
function getProjectPath() {
    return projectPath;
}
function setProjectPath(newPath) {
    projectPath = newPath;
}
function createServer(port) {
    const app = (0, express_1.default)();
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: [
            'https://vibr.ai',
            'http://vibr.ai',
            'http://localhost:3000',
            'http://localhost:3001',
        ],
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    // Auth middleware for all API routes
    app.use('/api', (0, auth_1.authMiddleware)());
    // Routes
    app.use('/api', status_1.statusRouter);
    app.use('/api', files_1.filesRouter);
    app.use('/api', git_1.gitRouter);
    app.use('/api', folder_picker_1.folderPickerRouter);
    const server = http_1.default.createServer(app);
    // WebSocket servers
    const terminalWss = new ws_1.WebSocketServer({ noServer: true });
    const watchWss = new ws_1.WebSocketServer({ noServer: true });
    // Handle WebSocket upgrades
    server.on('upgrade', async (request, socket, head) => {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const pathname = url.pathname;
        // Authenticate WebSocket connections
        const authenticated = await (0, auth_1.authenticateWebSocket)(request);
        if (!authenticated) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        if (pathname === '/terminal') {
            terminalWss.handleUpgrade(request, socket, head, (ws) => {
                terminalWss.emit('connection', ws, request);
            });
        }
        else if (pathname === '/watch') {
            watchWss.handleUpgrade(request, socket, head, (ws) => {
                watchWss.emit('connection', ws, request);
            });
        }
        else {
            socket.destroy();
        }
    });
    terminalWss.on('connection', (ws) => {
        (0, terminal_1.handleTerminalConnection)(ws);
    });
    watchWss.on('connection', (ws) => {
        (0, watch_1.handleWatchConnection)(ws);
    });
    return server;
}
//# sourceMappingURL=server.js.map