import { Request, Response, NextFunction } from 'express';
import { IncomingMessage } from 'http';
interface Config {
    secret: string;
    createdAt: string;
}
export declare function getConfigDir(): string;
export declare function getConfigPath(): string;
export declare function ensureConfig(): Promise<Config>;
export declare function getSecret(): Promise<string>;
export declare function generateToken(): Promise<string>;
export declare function verifyToken(token: string): Promise<boolean>;
export declare function authMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function authenticateWebSocket(req: IncomingMessage): Promise<boolean>;
export {};
//# sourceMappingURL=auth.d.ts.map