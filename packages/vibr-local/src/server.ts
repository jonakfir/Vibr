import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { authMiddleware, authenticateWebSocket } from './auth';
import { statusRouter } from './routes/status';
import { filesRouter } from './routes/files';
import { gitRouter } from './routes/git';
import { folderPickerRouter } from './routes/folder-picker';
import { handleTerminalConnection } from './routes/terminal';
import { handleWatchConnection } from './routes/watch';

let projectPath = process.cwd();

export function getProjectPath(): string {
  return projectPath;
}

export function setProjectPath(newPath: string): void {
  projectPath = newPath;
}

export function createServer(port: number): http.Server {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: [
        'https://vibr.ai',
        'http://vibr.ai',
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));

  // Auth middleware for all API routes
  app.use('/api', authMiddleware());

  // Routes
  app.use('/api', statusRouter);
  app.use('/api', filesRouter);
  app.use('/api', gitRouter);
  app.use('/api', folderPickerRouter);

  const server = http.createServer(app);

  // WebSocket servers
  const terminalWss = new WebSocketServer({ noServer: true });
  const watchWss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrades
  server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const pathname = url.pathname;

    // Authenticate WebSocket connections
    const authenticated = await authenticateWebSocket(request);
    if (!authenticated) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    if (pathname === '/terminal') {
      terminalWss.handleUpgrade(request, socket, head, (ws) => {
        terminalWss.emit('connection', ws, request);
      });
    } else if (pathname === '/watch') {
      watchWss.handleUpgrade(request, socket, head, (ws) => {
        watchWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  terminalWss.on('connection', (ws: WebSocket) => {
    handleTerminalConnection(ws);
  });

  watchWss.on('connection', (ws: WebSocket) => {
    handleWatchConnection(ws);
  });

  return server;
}
