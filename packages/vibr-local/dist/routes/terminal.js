"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTerminalConnection = handleTerminalConnection;
const child_process_1 = require("child_process");
const server_1 = require("../server");
function handleTerminalConnection(ws) {
    const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh';
    const proc = (0, child_process_1.spawn)(shell, ['-i'], {
        cwd: (0, server_1.getProjectPath)(),
        env: { ...process.env, TERM: 'xterm-256color' },
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    // Stream stdout to WebSocket
    proc.stdout?.on('data', (data) => {
        try {
            ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
        }
        catch {
            // WebSocket closed
        }
    });
    // Stream stderr to WebSocket
    proc.stderr?.on('data', (data) => {
        try {
            ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
        }
        catch {
            // WebSocket closed
        }
    });
    proc.on('exit', (exitCode) => {
        try {
            ws.send(JSON.stringify({ type: 'exit', exitCode }));
            ws.close();
        }
        catch {
            // WebSocket already closed
        }
    });
    // Handle messages from client
    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            switch (msg.type) {
                case 'input':
                    if (msg.data && proc.stdin) {
                        proc.stdin.write(msg.data);
                    }
                    break;
                case 'exec':
                    if (msg.command && proc.stdin) {
                        proc.stdin.write(msg.command + '\n');
                    }
                    break;
                case 'resize':
                    // child_process doesn't support resize, ignore
                    break;
            }
        }
        catch {
            // Ignore malformed messages
        }
    });
    // Cleanup on WebSocket close
    ws.on('close', () => {
        proc.kill();
    });
    ws.on('error', () => {
        proc.kill();
    });
}
//# sourceMappingURL=terminal.js.map