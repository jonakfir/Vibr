import { Router } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { getProjectPath } from '../server';

export const filesRouter = Router();

const EXCLUDED = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  '.DS_Store',
]);

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.js': 'javascript',
  '.jsx': 'javascriptreact',
  '.json': 'json',
  '.md': 'markdown',
  '.css': 'css',
  '.scss': 'scss',
  '.html': 'html',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.sql': 'sql',
  '.sh': 'shellscript',
  '.bash': 'shellscript',
  '.zsh': 'shellscript',
  '.env': 'dotenv',
  '.gitignore': 'ignore',
  '.svg': 'svg',
};

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileEntry[];
}

async function listDirectory(
  dirPath: string,
  basePath: string,
  depth: number,
  maxDepth: number
): Promise<FileEntry[]> {
  if (depth > maxDepth) return [];

  const entries: FileEntry[] = [];

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      if (EXCLUDED.has(item.name)) continue;

      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(basePath, fullPath);

      if (item.isDirectory()) {
        const children = await listDirectory(fullPath, basePath, depth + 1, maxDepth);
        entries.push({
          name: item.name,
          path: relativePath,
          type: 'directory',
          children,
        });
      } else {
        entries.push({
          name: item.name,
          path: relativePath,
          type: 'file',
        });
      }
    }
  } catch (err) {
    // Permission denied or other errors — skip silently
  }

  return entries.sort((a, b) => {
    // Directories first, then alphabetical
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// GET /api/files?path=
filesRouter.get('/files', async (req, res) => {
  try {
    const requestedPath = (req.query.path as string) || '';
    const basePath = getProjectPath();
    const targetPath = requestedPath
      ? path.resolve(basePath, requestedPath)
      : basePath;

    // Security: ensure path is within project
    if (!targetPath.startsWith(basePath)) {
      res.status(403).json({ error: 'Access denied: path outside project directory' });
      return;
    }

    const exists = await fs.pathExists(targetPath);
    if (!exists) {
      res.status(404).json({ error: 'Path not found' });
      return;
    }

    const tree = await listDirectory(targetPath, basePath, 0, 3);
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/read?path=
filesRouter.get('/files/read', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'path query parameter is required' });
      return;
    }

    const basePath = getProjectPath();
    const fullPath = path.resolve(basePath, filePath);

    // Security: ensure path is within project
    if (!fullPath.startsWith(basePath)) {
      res.status(403).json({ error: 'Access denied: path outside project directory' });
      return;
    }

    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      res.status(400).json({ error: 'Path is a directory, not a file' });
      return;
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    const ext = path.extname(fullPath).toLowerCase();
    const language = LANGUAGE_MAP[ext] || 'plaintext';

    res.json({
      path: filePath,
      content,
      language,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/write
filesRouter.post('/files/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath || content === undefined) {
      res.status(400).json({ error: 'path and content are required' });
      return;
    }

    const basePath = getProjectPath();
    const fullPath = path.resolve(basePath, filePath);

    // Security: ensure path is within project
    if (!fullPath.startsWith(basePath)) {
      res.status(403).json({ error: 'Access denied: path outside project directory' });
      return;
    }

    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');

    res.json({ success: true, path: filePath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
