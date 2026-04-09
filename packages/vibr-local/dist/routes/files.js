"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesRouter = void 0;
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const server_1 = require("../server");
exports.filesRouter = (0, express_1.Router)();
const EXCLUDED = new Set([
    'node_modules',
    '.git',
    '.next',
    'dist',
    '.DS_Store',
]);
const LANGUAGE_MAP = {
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
async function listDirectory(dirPath, basePath, depth, maxDepth) {
    if (depth > maxDepth)
        return [];
    const entries = [];
    try {
        const items = await fs_extra_1.default.readdir(dirPath, { withFileTypes: true });
        for (const item of items) {
            if (EXCLUDED.has(item.name))
                continue;
            const fullPath = path_1.default.join(dirPath, item.name);
            const relativePath = path_1.default.relative(basePath, fullPath);
            if (item.isDirectory()) {
                const children = await listDirectory(fullPath, basePath, depth + 1, maxDepth);
                entries.push({
                    name: item.name,
                    path: relativePath,
                    type: 'directory',
                    children,
                });
            }
            else {
                entries.push({
                    name: item.name,
                    path: relativePath,
                    type: 'file',
                });
            }
        }
    }
    catch (err) {
        // Permission denied or other errors — skip silently
    }
    return entries.sort((a, b) => {
        // Directories first, then alphabetical
        if (a.type !== b.type)
            return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}
// GET /api/files?path=
exports.filesRouter.get('/files', async (req, res) => {
    try {
        const requestedPath = req.query.path || '';
        const basePath = (0, server_1.getProjectPath)();
        const targetPath = requestedPath
            ? path_1.default.resolve(basePath, requestedPath)
            : basePath;
        // Security: ensure path is within project
        if (!targetPath.startsWith(basePath)) {
            res.status(403).json({ error: 'Access denied: path outside project directory' });
            return;
        }
        const exists = await fs_extra_1.default.pathExists(targetPath);
        if (!exists) {
            res.status(404).json({ error: 'Path not found' });
            return;
        }
        const tree = await listDirectory(targetPath, basePath, 0, 3);
        res.json(tree);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/files/read?path=
exports.filesRouter.get('/files/read', async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            res.status(400).json({ error: 'path query parameter is required' });
            return;
        }
        const basePath = (0, server_1.getProjectPath)();
        const fullPath = path_1.default.resolve(basePath, filePath);
        // Security: ensure path is within project
        if (!fullPath.startsWith(basePath)) {
            res.status(403).json({ error: 'Access denied: path outside project directory' });
            return;
        }
        const exists = await fs_extra_1.default.pathExists(fullPath);
        if (!exists) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        const stat = await fs_extra_1.default.stat(fullPath);
        if (stat.isDirectory()) {
            res.status(400).json({ error: 'Path is a directory, not a file' });
            return;
        }
        const content = await fs_extra_1.default.readFile(fullPath, 'utf-8');
        const ext = path_1.default.extname(fullPath).toLowerCase();
        const language = LANGUAGE_MAP[ext] || 'plaintext';
        res.json({
            path: filePath,
            content,
            language,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/files/write
exports.filesRouter.post('/files/write', async (req, res) => {
    try {
        const { path: filePath, content } = req.body;
        if (!filePath || content === undefined) {
            res.status(400).json({ error: 'path and content are required' });
            return;
        }
        const basePath = (0, server_1.getProjectPath)();
        const fullPath = path_1.default.resolve(basePath, filePath);
        // Security: ensure path is within project
        if (!fullPath.startsWith(basePath)) {
            res.status(403).json({ error: 'Access denied: path outside project directory' });
            return;
        }
        await fs_extra_1.default.ensureDir(path_1.default.dirname(fullPath));
        await fs_extra_1.default.writeFile(fullPath, content, 'utf-8');
        res.json({ success: true, path: filePath });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//# sourceMappingURL=files.js.map