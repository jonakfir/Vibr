import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs-extra';
import { Request, Response, NextFunction } from 'express';
import { IncomingMessage } from 'http';

const CONFIG_DIR = path.join(process.env.HOME || '~', '.vibr-local');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

interface Config {
  secret: string;
  createdAt: string;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export async function ensureConfig(): Promise<Config> {
  await fs.ensureDir(CONFIG_DIR);

  if (await fs.pathExists(CONFIG_PATH)) {
    return fs.readJson(CONFIG_PATH);
  }

  const config: Config = {
    secret: crypto.randomBytes(64).toString('hex'),
    createdAt: new Date().toISOString(),
  };

  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
  return config;
}

export async function getSecret(): Promise<string> {
  const config = await ensureConfig();
  return config.secret;
}

export async function generateToken(): Promise<string> {
  const secret = await getSecret();
  return jwt.sign(
    {
      type: 'vibr-local',
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    { expiresIn: '30d' }
  );
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = await getSecret();
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function authMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
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

export async function authenticateWebSocket(req: IncomingMessage): Promise<boolean> {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    return false;
  }

  return verifyToken(token);
}
