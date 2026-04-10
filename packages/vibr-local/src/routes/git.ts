import { Router } from 'express';
import simpleGit from 'simple-git';
import { getProjectPath } from '../server';

export const gitRouter = Router();

function getGit() {
  return simpleGit(getProjectPath());
}

// GET /api/git/status
gitRouter.get('/git/status', async (_req, res) => {
  try {
    const git = getGit();
    const status = await git.status();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/init
gitRouter.post('/git/init', async (_req, res) => {
  try {
    const git = getGit();
    await git.init();
    res.json({ success: true, message: 'Git repository initialized' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/commit
gitRouter.post('/git/commit', async (req, res) => {
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/git/log
gitRouter.get('/git/log', async (_req, res) => {
  try {
    const git = getGit();
    const log = await git.log({ maxCount: 20 });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/git/diff
gitRouter.get('/git/diff', async (_req, res) => {
  try {
    const git = getGit();
    const diff = await git.diff();
    res.json({ diff });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
