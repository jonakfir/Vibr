import { Router } from 'express';
import { getProjectPath } from '../server';

const packageJson = require('../../package.json');

export const statusRouter = Router();

statusRouter.get('/status', (_req, res) => {
  res.json({
    status: 'ok',
    version: packageJson.version,
    projectPath: getProjectPath(),
    platform: process.platform,
  });
});
