/**
 * @server-only
 *
 * @file Server-side module for PR testing
 * This file contains server-only code and should not be imported in browser contexts
 */

import { exec, spawn } from 'child_process';
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

    // Navigate to the repository directory
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

    // Create .pr-testing directory if it doesn't exist
    const prTestingDir = path.join(os.tmpdir(), '.pr-testing');

    if (!fs.existsSync(prTestingDir)) {
      fs.mkdirSync(prTestingDir, { recursive: true });
    }

    // Navigate to the repository directory
    const originalDir = process.cwd();

    process.chdir(tempDir);

    try {
      // Start the application
      console.log('Starting application with command: npm run dev');

      // Use a fixed port for the PR test (5174 for the first PR, increment for others)
      const port = 5174;

      // Set environment variables for the PR test
      const env = {
        ...process.env,
        PORT: port.toString(),
        PR_TEST: 'true',
        PR_NUMBER: prNumber.toString(),
      };

      // Start the application as a detached process
      const child = spawn('npm', ['run', 'dev'], {
        env,
        detached: true,
        stdio: 'ignore',
      });

      // Get the process ID
      const pid = child.pid;

      // Unref the child to allow the parent to exit
      child.unref();

      // Create a .pr-testing directory if it doesn't exist
      const prTestingDir = path.join(os.tmpdir(), '.pr-testing');

      if (!fs.existsSync(prTestingDir)) {
        fs.mkdirSync(prTestingDir, { recursive: true });
      }

      // Write process info to a file for tracking
      const processInfo = {
        pid,
        prNumber,
        tempDir,
        startCommand: 'npm run dev',
        port: 5174, // Fixed port for the first PR
      };

      fs.writeFileSync(path.join(prTestingDir, `pr-${prNumber}.json`), JSON.stringify(processInfo, null, 2), 'utf-8');

      // Return to the original directory
      process.chdir(originalDir);

      return {
        success: true,
        message: `Successfully started application for PR #${prNumber}`,
        data: {
          pid,
          prNumber,
          tempDir,
          startCommand: 'npm run dev',
          port: 5174, // Return the port in the response
        },
      };
    } catch (error) {
      // Return to the original directory in case of error
      process.chdir(originalDir);
      throw error;
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

      // First, try to kill all child processes
      try {
        // For Unix-like systems (macOS, Linux)
        if (process.platform !== 'win32') {
          await execPromise(`pkill -P ${pid}`).catch(() => {
            // Ignore errors if no child processes found
            console.log(`No child processes found for PID ${pid}`);
          });
        } else {
          // For Windows
          await execPromise(`taskkill /F /T /PID ${pid}`).catch(() => {
            // Ignore errors if no child processes found
            console.log(`No child processes found for PID ${pid}`);
          });
        }
      } catch (error) {
        console.log(`Error killing child processes: ${error}`);
      }

      // Then kill the main process
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

    // Clean up the temporary directory
    try {
      if (fs.existsSync(tempDir)) {
        console.log(`Cleaning up temporary directory: ${tempDir}`);

        // Use recursive deletion with force option to handle read-only files
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error(`Error cleaning up temporary directory: ${cleanupError}`);

      // Continue with the operation even if cleanup fails
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
