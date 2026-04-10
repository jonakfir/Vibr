import { WebSocket } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import { getProjectPath } from '../server';

interface TerminalMessage {
  type: 'input' | 'resize' | 'exec';
  data?: string;
  command?: string;
  cols?: number;
  rows?: number;
}

export function handleTerminalConnection(ws: WebSocket): void {
  const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh';

  const proc: ChildProcess = spawn(shell, ['-i'], {
    cwd: getProjectPath(),
    env: { ...process.env, TERM: 'xterm-256color' } as Record<string, string>,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Stream stdout to WebSocket
  proc.stdout?.on('data', (data: Buffer) => {
    try {
      ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
    } catch {
      // WebSocket closed
    }
  });

  // Stream stderr to WebSocket
  proc.stderr?.on('data', (data: Buffer) => {
    try {
      ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
    } catch {
      // WebSocket closed
    }
  });

  proc.on('exit', (exitCode) => {
    try {
      ws.send(JSON.stringify({ type: 'exit', exitCode }));
      ws.close();
    } catch {
      // WebSocket already closed
    }
  });

  // Handle messages from client
  ws.on('message', (raw: Buffer) => {
    try {
      const msg: TerminalMessage = JSON.parse(raw.toString());

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
    } catch {
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
