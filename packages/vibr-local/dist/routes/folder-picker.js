"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderPickerRouter = void 0;
const express_1 = require("express");
const child_process_1 = require("child_process");
const server_1 = require("../server");
exports.folderPickerRouter = (0, express_1.Router)();
function openFolderPicker() {
    return new Promise((resolve, reject) => {
        const platform = process.platform;
        if (platform === 'darwin') {
            // macOS: use AppleScript
            const script = `osascript -e 'POSIX path of (choose folder with prompt "Select project folder")'`;
            (0, child_process_1.exec)(script, (error, stdout, stderr) => {
                if (error) {
                    // User cancelled the dialog
                    if (stderr.includes('User canceled')) {
                        reject(new Error('User cancelled folder selection'));
                    }
                    else {
                        reject(new Error(`Failed to open folder picker: ${stderr}`));
                    }
                    return;
                }
                resolve(stdout.trim());
            });
        }
        else if (platform === 'win32') {
            // Windows: use PowerShell
            const script = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'Select project folder'; if ($dialog.ShowDialog() -eq 'OK') { $dialog.SelectedPath } else { throw 'cancelled' }"`;
            (0, child_process_1.exec)(script, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error('User cancelled folder selection'));
                    return;
                }
                resolve(stdout.trim());
            });
        }
        else {
            // Linux: try zenity
            const script = `zenity --file-selection --directory --title="Select project folder"`;
            (0, child_process_1.exec)(script, (error, stdout) => {
                if (error) {
                    reject(new Error('User cancelled folder selection or zenity not available'));
                    return;
                }
                resolve(stdout.trim());
            });
        }
    });
}
// POST /api/folder-picker
exports.folderPickerRouter.post('/folder-picker', async (_req, res) => {
    try {
        const selectedPath = await openFolderPicker();
        (0, server_1.setProjectPath)(selectedPath);
        res.json({ path: selectedPath });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
//# sourceMappingURL=folder-picker.js.map