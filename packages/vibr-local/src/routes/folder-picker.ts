import { Router } from 'express';
import { exec } from 'child_process';
import { setProjectPath } from '../server';

export const folderPickerRouter = Router();

function openFolderPicker(): Promise<string> {
  return new Promise((resolve, reject) => {
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS: use AppleScript
      const script = `osascript -e 'POSIX path of (choose folder with prompt "Select project folder")'`;
      exec(script, (error, stdout, stderr) => {
        if (error) {
          // User cancelled the dialog
          if (stderr.includes('User canceled')) {
            reject(new Error('User cancelled folder selection'));
          } else {
            reject(new Error(`Failed to open folder picker: ${stderr}`));
          }
          return;
        }
        resolve(stdout.trim());
      });
    } else if (platform === 'win32') {
      // Windows: use PowerShell
      const script = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'Select project folder'; if ($dialog.ShowDialog() -eq 'OK') { $dialog.SelectedPath } else { throw 'cancelled' }"`;
      exec(script, (error, stdout, stderr) => {
        if (error) {
          reject(new Error('User cancelled folder selection'));
          return;
        }
        resolve(stdout.trim());
      });
    } else {
      // Linux: try zenity
      const script = `zenity --file-selection --directory --title="Select project folder"`;
      exec(script, (error, stdout) => {
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
folderPickerRouter.post('/folder-picker', async (_req, res) => {
  try {
    const selectedPath = await openFolderPicker();
    setProjectPath(selectedPath);
    res.json({ path: selectedPath });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
