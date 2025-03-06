/**
 * @server-only
 *
 * @file Server-side module for PR testing
 * This file contains server-only code and should not be imported in browser contexts
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import { path } from './path.server';
import * as os from 'os';

// Helper function to execute shell commands
export const execPromise = (command: string, options: any = {}): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command failed: ${error.message}\n${stderr}`));
        return;
      }

      resolve(stdout.toString());
    });
  });
};

export interface ClonePRParams {
  prNumber: number;
  branch: string;
  repoUrl: string;
  repoName: string;
}

export interface StartAppParams {
  tempDir: string;
  prNumber: number;
}

export interface StopAppParams {
  pid: number;
  tempDir: string;
  prNumber: number;
}

export async function clonePR(params: ClonePRParams) {
  const { prNumber, branch, repoUrl, repoName } = params;

  // Create a temporary directory for the PR
  const tempDir = path.join(os.tmpdir(), `pr-${prNumber}-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  console.log(`Created temporary directory: ${tempDir}`);

  try {
    // Clone the repository
    console.log(`Cloning repository: ${repoUrl} to ${tempDir}`);
    await execPromise(`git clone ${repoUrl} ${tempDir}`);

    // Navigate to the repository directory and fetch the PR branch
    const originalDir = process.cwd();
    process.chdir(tempDir);

    try {
      // Fetch the PR branch
      console.log(`Fetching PR branch: ${branch}`);
      await execPromise(`git fetch origin ${branch}:pr-${prNumber}`);

      // Checkout the PR branch
      console.log(`Checking out PR branch: pr-${prNumber}`);
      await execPromise(`git checkout pr-${prNumber}`);

      // Install dependencies if package.json exists
      let testResults = 'No tests found';

      if (fs.existsSync(path.join(tempDir, 'package.json'))) {
        console.log('Installing dependencies');
        await execPromise('npm install');

        // Run tests if available
        const packageJson = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf-8'));

        if (packageJson.scripts && packageJson.scripts.test) {
          console.log('Running tests');

          try {
            testResults = await execPromise('npm test');
          } catch (error) {
            testResults = `Tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        }
      }

      // Return to the original directory
      process.chdir(originalDir);

      return {
        success: true,
        message: `Successfully cloned and set up PR #${prNumber}`,
        data: {
          prNumber,
          branch,
          repoUrl,
          repoName,
          tempDir,
          testResults,
        },
      };
    } finally {
      // Make sure we return to the original directory even if an error occurs
      process.chdir(originalDir);
    }
  } catch (error) {
    console.error('Error testing PR:', error);
    return {
      success: false,
      message: `Failed to test PR: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function startApp(params: StartAppParams) {
  const { tempDir, prNumber } = params;

  try {
    // Check if the directory exists
    if (!fs.existsSync(tempDir)) {
      return {
        success: false,
        message: `Directory not found: ${tempDir}`,
      };
    }

    // Navigate to the repository directory
    const originalDir = process.cwd();
    process.chdir(tempDir);

    try {
      // Determine the start command
      let startCommand = 'npm start';

      if (fs.existsSync(path.join(tempDir, 'package.json'))) {
        const packageJson = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf-8'));

        if (packageJson.scripts) {
          if (packageJson.scripts.dev) {
            startCommand = 'npm run dev';
          } else if (packageJson.scripts.develop) {
            startCommand = 'npm run develop';
          } else if (packageJson.scripts.serve) {
            startCommand = 'npm run serve';
          }
        }
      }

      // Start the application in a detached process
      console.log(`Starting application with command: ${startCommand}`);

      const child = exec(startCommand, {
        cwd: tempDir,
        env: process.env,
        windowsHide: true,
      });

      // Unref the child process to allow the parent to exit
      child.unref();

      // Store the process ID for later use
      const pid = child.pid || 0;
      const processInfo = {
        pid,
        prNumber,
        tempDir,
        startCommand,
        startTime: new Date().toISOString(),
      };

      // Save the process info to a file for later reference
      const processInfoDir = path.join(tempDir, '.pr-testing');
      fs.mkdirSync(processInfoDir, { recursive: true });
      fs.writeFileSync(path.join(processInfoDir, 'process-info.json'), JSON.stringify(processInfo, null, 2));

      // Return to the original directory
      process.chdir(originalDir);

      return {
        success: true,
        message: `Successfully started application for PR #${prNumber}`,
        data: {
          pid,
          prNumber,
          tempDir,
          startCommand,
        },
      };
    } finally {
      // Make sure we return to the original directory even if an error occurs
      process.chdir(originalDir);
    }
  } catch (error) {
    console.error('Error starting application:', error);
    return {
      success: false,
      message: `Failed to start application: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function stopApp(params: StopAppParams) {
  const { pid, tempDir, prNumber } = params;

  try {
    // Check if the process is running
    try {
      // On Unix-like systems, sending signal 0 checks if the process exists
      process.kill(pid, 0);

      // If we get here, the process exists, so kill it
      process.kill(pid);
      console.log(`Killed process with PID: ${pid}`);
    } catch {
      // Process doesn't exist or we don't have permission to kill it
      console.log(`Process with PID ${pid} is not running or cannot be killed`);
    }

    // Clean up the process info file
    const processInfoPath = path.join(tempDir, '.pr-testing', 'process-info.json');

    if (fs.existsSync(processInfoPath)) {
      fs.unlinkSync(processInfoPath);
    }

    return {
      success: true,
      message: `Successfully stopped application for PR #${prNumber}`,
      data: {
        pid,
        prNumber,
        tempDir,
      },
    };
  } catch (error) {
    console.error('Error stopping application:', error);
    return {
      success: false,
      message: `Failed to stop application: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
