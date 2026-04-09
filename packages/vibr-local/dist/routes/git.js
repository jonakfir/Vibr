"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitRouter = void 0;
const express_1 = require("express");
const simple_git_1 = __importDefault(require("simple-git"));
const server_1 = require("../server");
exports.gitRouter = (0, express_1.Router)();
function getGit() {
    return (0, simple_git_1.default)((0, server_1.getProjectPath)());
}
// GET /api/git/status
exports.gitRouter.get('/git/status', async (_req, res) => {
    try {
        const git = getGit();
        const status = await git.status();
        res.json(status);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/git/init
exports.gitRouter.post('/git/init', async (_req, res) => {
    try {
        const git = getGit();
        await git.init();
        res.json({ success: true, message: 'Git repository initialized' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/git/commit
exports.gitRouter.post('/git/commit', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ error: 'message is required' });
            return;
        }
        const git = getGit();
        await git.add('.');
        const result = await git.commit(message);
        res.json({ success: true, result });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/git/log
exports.gitRouter.get('/git/log', async (_req, res) => {
    try {
        const git = getGit();
        const log = await git.log({ maxCount: 20 });
        res.json(log);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/git/diff
exports.gitRouter.get('/git/diff', async (_req, res) => {
    try {
        const git = getGit();
        const diff = await git.diff();
        res.json({ diff });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//# sourceMappingURL=git.js.map