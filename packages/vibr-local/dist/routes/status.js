"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusRouter = void 0;
const express_1 = require("express");
const server_1 = require("../server");
const packageJson = require('../../package.json');
exports.statusRouter = (0, express_1.Router)();
exports.statusRouter.get('/status', (_req, res) => {
    res.json({
        status: 'ok',
        version: packageJson.version,
        projectPath: (0, server_1.getProjectPath)(),
        platform: process.platform,
    });
});
//# sourceMappingURL=status.js.map