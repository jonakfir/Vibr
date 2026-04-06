#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { createServer } from './server';
import { ensureConfig, generateToken, getConfigDir } from './auth';

const packageJson = require('../package.json');

const PID_FILE = path.join(getConfigDir(), 'pid');
const PORT_FILE = path.join(getConfigDir(), 'port');

const program = new Command();

program
  .name('vibr-local')
  .description('Local server for Vibr web app — access files, git, and terminal')
  .version(packageJson.version);

program
  .command('start')
  .description('Start the vibr-local server')
  .option('-p, --port <port>', 'Port to listen on', '47821')
  .action(async (options) => {
    const port = parseInt(options.port, 10);

    // Ensure config exists (generates JWT secret on first run)
    await ensureConfig();

    // Check if already running
    if (await fs.pathExists(PID_FILE)) {
      const pid = parseInt(await fs.readFile(PID_FILE, 'utf-8'), 10);
      try {
        process.kill(pid, 0);
        console.log(chalk.yellow(`vibr-local is already running (PID: ${pid})`));
        console.log(chalk.gray(`Stop it with: vibr-local stop`));
        return;
      } catch {
        // Process not running, clean up stale PID file
        await fs.remove(PID_FILE);
      }
    }

    // Generate auth token
    const token = await generateToken();

    // Create and start server
    const server = createServer(port);

    server.listen(port, () => {
      console.log('');
      console.log(chalk.green.bold('  vibr-local running on http://localhost:' + port));
      console.log('');
      console.log(chalk.gray('  Project directory: ') + chalk.white(process.cwd()));
      console.log(chalk.gray('  Platform:          ') + chalk.white(process.platform));
      console.log('');
      console.log(chalk.cyan('  Auth token (use this in the Vibr web app):'));
      console.log('');
      console.log(chalk.yellow('  ' + token));
      console.log('');
      console.log(chalk.gray('  This token expires in 30 days.'));
      console.log(chalk.gray('  Press Ctrl+C to stop the server.'));
      console.log('');
    });

    // Save PID and port
    await fs.ensureDir(getConfigDir());
    await fs.writeFile(PID_FILE, process.pid.toString());
    await fs.writeFile(PORT_FILE, port.toString());

    // Cleanup on exit
    const cleanup = async () => {
      await fs.remove(PID_FILE).catch(() => {});
      await fs.remove(PORT_FILE).catch(() => {});
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  });

program
  .command('stop')
  .description('Stop the running vibr-local server')
  .action(async () => {
    if (!(await fs.pathExists(PID_FILE))) {
      console.log(chalk.yellow('vibr-local is not running.'));
      return;
    }

    const pid = parseInt(await fs.readFile(PID_FILE, 'utf-8'), 10);

    try {
      process.kill(pid, 'SIGTERM');
      console.log(chalk.green(`vibr-local stopped (PID: ${pid})`));
    } catch {
      console.log(chalk.yellow('Process not found. Cleaning up stale PID file.'));
    }

    await fs.remove(PID_FILE);
    await fs.remove(PORT_FILE);
  });

program
  .command('status')
  .description('Check if vibr-local is running')
  .action(async () => {
    if (!(await fs.pathExists(PID_FILE))) {
      console.log(chalk.yellow('vibr-local is not running.'));
      return;
    }

    const pid = parseInt(await fs.readFile(PID_FILE, 'utf-8'), 10);
    const port = (await fs.pathExists(PORT_FILE))
      ? await fs.readFile(PORT_FILE, 'utf-8')
      : 'unknown';

    try {
      process.kill(pid, 0);
      console.log(chalk.green(`vibr-local is running`));
      console.log(chalk.gray(`  PID:  `) + chalk.white(pid));
      console.log(chalk.gray(`  Port: `) + chalk.white(port));
    } catch {
      console.log(chalk.yellow('vibr-local is not running (stale PID file found).'));
      await fs.remove(PID_FILE);
      await fs.remove(PORT_FILE);
    }
  });

program.parse(process.argv);

// Default to start if no command given
if (!process.argv.slice(2).length) {
  program.help();
}
