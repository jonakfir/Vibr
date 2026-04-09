"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigDir = getConfigDir;
exports.getConfigPath = getConfigPath;
exports.ensureConfig = ensureConfig;
exports.getSecret = getSecret;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.authMiddleware = authMiddleware;
exports.authenticateWebSocket = authenticateWebSocket;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const CONFIG_DIR = path_1.default.join(process.env.HOME || '~', '.vibr-local');
const CONFIG_PATH = path_1.default.join(CONFIG_DIR, 'config.json');
function getConfigDir() {
    return CONFIG_DIR;
}
function getConfigPath() {
    return CONFIG_PATH;
}
async function ensureConfig() {
    await fs_extra_1.default.ensureDir(CONFIG_DIR);
    if (await fs_extra_1.default.pathExists(CONFIG_PATH)) {
        return fs_extra_1.default.readJson(CONFIG_PATH);
    }
    const config = {
        secret: crypto_1.default.randomBytes(64).toString('hex'),
        createdAt: new Date().toISOString(),
    };
    await fs_extra_1.default.writeJson(CONFIG_PATH, config, { spaces: 2 });
    return config;
}
async function getSecret() {
    const config = await ensureConfig();
    return config.secret;
}
async function generateToken() {
    const secret = await getSecret();
    return jsonwebtoken_1.default.sign({
        type: 'vibr-local',
        iat: Math.floor(Date.now() / 1000),
    }, secret, { expiresIn: '30d' });
}
async function verifyToken(token) {
    try {
        const secret = await getSecret();
        jsonwebtoken_1.default.verify(token, secret);
        return true;
    }
    catch {
        return false;
    }
}
function authMiddleware() {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }
        const token = authHeader.slice(7);
        const valid = await verifyToken(token);
        if (!valid) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        next();
    };
}
async function authenticateWebSocket(req) {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
        return false;
    }
    return verifyToken(token);
}
//# sourceMappingURL=auth.js.map