#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const server_1 = require("./server");
const auth_1 = require("./auth");
const packageJson = require('../package.json');
const PID_FILE = path_1.default.join((0, auth_1.getConfigDir)(), 'pid');
const PORT_FILE = path_1.default.join((0, auth_1.getConfigDir)(), 'port');
const program = new commander_1.Command();
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
    await (0, auth_1.ensureConfig)();
    // Check if already running
    if (await fs_extra_1.default.pathExists(PID_FILE)) {
        const pid = parseInt(await fs_extra_1.default.readFile(PID_FILE, 'utf-8'), 10);
        try {
            process.kill(pid, 0);
            console.log(chalk_1.default.yellow(`vibr-local is already running (PID: ${pid})`));
            console.log(chalk_1.default.gray(`Stop it with: vibr-local stop`));
            return;
        }
        catch {
            // Process not running, clean up stale PID file
            await fs_extra_1.default.remove(PID_FILE);
        }
    }
    // Generate auth token
    const token = await (0, auth_1.generateToken)();
    // Create and start server
    const server = (0, server_1.createServer)(port);
    server.listen(port, () => {
        console.log('');
        console.log(chalk_1.default.green.bold('  vibr-local running on http://localhost:' + port));
        console.log('');
        console.log(chalk_1.default.gray('  Project directory: ') + chalk_1.default.white(process.cwd()));
        console.log(chalk_1.default.gray('  Platform:          ') + chalk_1.default.white(process.platform));
        console.log('');
        console.log(chalk_1.default.cyan('  Auth token (use this in the Vibr web app):'));
        console.log('');
        console.log(chalk_1.default.yellow('  ' + token));
        console.log('');
        console.log(chalk_1.default.gray('  This token expires in 30 days.'));
        console.log(chalk_1.default.gray('  Press Ctrl+C to stop the server.'));
        console.log('');
    });
    // Save PID and port
    await fs_extra_1.default.ensureDir((0, auth_1.getConfigDir)());
    await fs_extra_1.default.writeFile(PID_FILE, process.pid.toString());
    await fs_extra_1.default.writeFile(PORT_FILE, port.toString());
    // Cleanup on exit
    const cleanup = async () => {
        await fs_extra_1.default.remove(PID_FILE).catch(() => { });
        await fs_extra_1.default.remove(PORT_FILE).catch(() => { });
        process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
});
program
    .command('stop')
    .description('Stop the running vibr-local server')
    .action(async () => {
    if (!(await fs_extra_1.default.pathExists(PID_FILE))) {
        console.log(chalk_1.default.yellow('vibr-local is not running.'));
        return;
    }
    const pid = parseInt(await fs_extra_1.default.readFile(PID_FILE, 'utf-8'), 10);
    try {
        process.kill(pid, 'SIGTERM');
        console.log(chalk_1.default.green(`vibr-local stopped (PID: ${pid})`));
    }
    catch {
        console.log(chalk_1.default.yellow('Process not found. Cleaning up stale PID file.'));
    }
    await fs_extra_1.default.remove(PID_FILE);
    await fs_extra_1.default.remove(PORT_FILE);
});
program
    .command('status')
    .description('Check if vibr-local is running')
    .action(async () => {
    if (!(await fs_extra_1.default.pathExists(PID_FILE))) {
        console.log(chalk_1.default.yellow('vibr-local is not running.'));
        return;
    }
    const pid = parseInt(await fs_extra_1.default.readFile(PID_FILE, 'utf-8'), 10);
    const port = (await fs_extra_1.default.pathExists(PORT_FILE))
        ? await fs_extra_1.default.readFile(PORT_FILE, 'utf-8')
        : 'unknown';
    try {
        process.kill(pid, 0);
        console.log(chalk_1.default.green(`vibr-local is running`));
        console.log(chalk_1.default.gray(`  PID:  `) + chalk_1.default.white(pid));
        console.log(chalk_1.default.gray(`  Port: `) + chalk_1.default.white(port));
    }
    catch {
        console.log(chalk_1.default.yellow('vibr-local is not running (stale PID file found).'));
        await fs_extra_1.default.remove(PID_FILE);
        await fs_extra_1.default.remove(PORT_FILE);
    }
});
program.parse(process.argv);
// Default to start if no command given
if (!process.argv.slice(2).length) {
    program.help();
}
//# sourceMappingURL=cli.js.map