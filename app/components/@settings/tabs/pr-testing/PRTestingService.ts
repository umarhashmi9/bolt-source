import { toast } from 'react-toastify';
import { logStore } from '~/lib/stores/logs';
import type { PullRequest, PRTestingResult } from './types';

interface CloneResponse {
  success: boolean;
  message: string;
  data?: {
    prNumber: number;
    branch: string;
    repoUrl: string;
    repoName: string;
    tempDir: string;
    testResults: string;
  };
}

interface StartResponse {
  success: boolean;
  message: string;
  data?: {
    pid: number;
    prNumber: number;
    tempDir: string;
    startCommand: string;
    port?: number;
  };
}

interface StopResponse {
  success: boolean;
  message: string;
  data?: {
    pid: number;
    prNumber: number;
    tempDir: string;
  };
}

export class PRTestingService {
  private static _instance: PRTestingService;
  private _token: string | null = null;
  private _activeTests: Map<number, { pid?: number; tempDir?: string }> = new Map();
  private _initialized: boolean = false;
  private _initPromise: Promise<void> | null = null;
  private _setupLogs: Map<number, string[]> = new Map();

  private constructor() {
    // Initialize the service
    this._loadToken();
    this._initPromise = this._initialize();
  }

  private async _initialize(): Promise<void> {
    try {
      await this._loadActiveTests();
      this._initialized = true;
    } catch (error) {
      console.error('Failed to initialize PR Testing Service:', error);
    }
  }

  static getInstance(): PRTestingService {
    if (!PRTestingService._instance) {
      PRTestingService._instance = new PRTestingService();
    }

    return PRTestingService._instance;
  }

  private _loadToken(): void {
    try {
      const githubConnection = localStorage.getItem('github_connection');

      if (githubConnection) {
        const { token } = JSON.parse(githubConnection);
        this._token = token;
      }
    } catch (error) {
      logStore.logError('Failed to load GitHub token', { error });
      this._token = null;
    }
  }

  async fetchPullRequests(state: 'all' | 'open' | 'closed' = 'open'): Promise<PullRequest[]> {
    this._loadToken();

    if (!this._token) {
      toast.error('GitHub token not found. Please connect your GitHub account first.');
      return [];
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/stackblitz-labs/bolt.diy/pulls?state=${state}&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${this._token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch pull requests: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logStore.logError('Failed to fetch pull requests', { error });
      throw error;
    }
  }

  async fetchPullRequestDetails(prNumber: number): Promise<PullRequest> {
    this._loadToken();

    if (!this._token) {
      toast.error('GitHub token not found. Please connect your GitHub account first.');
      throw new Error('GitHub token not found');
    }

    try {
      const response = await fetch(`https://api.github.com/repos/stackblitz-labs/bolt.diy/pulls/${prNumber}`, {
        headers: {
          Authorization: `Bearer ${this._token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pull request details: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logStore.logError('Failed to fetch pull request details', { error, prNumber });
      throw error;
    }
  }

  async testPullRequest(pr: PullRequest): Promise<PRTestingResult> {
    try {
      await this.ensureInitialized();

      // Check if there's already an active test for this PR
      if (this._activeTests.has(pr.number)) {
        return {
          success: false,
          message: `A test is already running for PR #${pr.number}`,
        };
      }

      // Initialize setup logs for this PR
      this._setupLogs.set(pr.number, []);
      this._addSetupLog(pr.number, `Starting test for PR #${pr.number}: ${pr.title}`);

      // Clone the PR
      this._addSetupLog(pr.number, `Cloning repository from ${pr.head.repo.clone_url}...`);

      const cloneResponse = await this._clonePR(pr);

      if (!cloneResponse.success || !cloneResponse.data) {
        this._addSetupLog(pr.number, `Failed to clone PR: ${cloneResponse.message}`);
        return {
          success: false,
          message: cloneResponse.message,
        };
      }

      this._addSetupLog(pr.number, `Successfully cloned PR to ${cloneResponse.data.tempDir}`);

      // Start the application
      this._addSetupLog(pr.number, `Starting application...`);

      const startResponse = await this._startApp(pr.number, cloneResponse.data.tempDir);

      if (!startResponse.success || !startResponse.data) {
        this._addSetupLog(pr.number, `Failed to start application: ${startResponse.message}`);
        return {
          success: false,
          message: startResponse.message,
        };
      }

      this._addSetupLog(pr.number, `Application started successfully with PID ${startResponse.data.pid}`);

      if (startResponse.data.port) {
        this._addSetupLog(pr.number, `Server running at http://localhost:${startResponse.data.port}`);
      }

      // Store the active test
      this._activeTests.set(pr.number, {
        pid: startResponse.data.pid,
        tempDir: startResponse.data.tempDir,
      });

      return {
        success: true,
        message: `Successfully started test for PR #${pr.number}`,
        data: {
          pid: startResponse.data.pid,
          tempDir: startResponse.data.tempDir,
          port: startResponse.data.port,
        },
      };
    } catch (error) {
      this._addSetupLog(pr.number, `Error testing PR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logStore.logError('Failed to test PR', { error, pr });

      return {
        success: false,
        message: `Failed to test PR #${pr.number}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async stopTest(prNumber: number): Promise<PRTestingResult> {
    try {
      await this.ensureInitialized();

      const activeTest = this._activeTests.get(prNumber);

      if (!activeTest || !activeTest.pid || !activeTest.tempDir) {
        return {
          success: false,
          message: `No active test found for PR #${prNumber}`,
        };
      }

      const stopResponse = await this._stopApp(prNumber, activeTest.pid, activeTest.tempDir);

      if (!stopResponse.success) {
        return {
          success: false,
          message: stopResponse.message,
        };
      }

      // Remove the active test
      this._activeTests.delete(prNumber);

      return {
        success: true,
        message: `Successfully stopped test for PR #${prNumber}`,
      };
    } catch (error) {
      logStore.logError('Failed to stop test', { error, prNumber });
      return {
        success: false,
        message: `Failed to stop test for PR #${prNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async _clonePR(pr: PullRequest): Promise<CloneResponse> {
    try {
      // Log the request for debugging
      console.log('Cloning PR:', {
        prNumber: pr.number,
        branch: pr.head.ref,
        repoUrl: pr.head.repo.clone_url,
        repoName: pr.head.repo.full_name,
      });

      const response = await fetch('/api/pr-testing/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prNumber: pr.number,
          branch: pr.head.ref,
          repoUrl: pr.head.repo.clone_url,
          repoName: pr.head.repo.full_name,
        }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server responded with ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (error) {
      logStore.logError('Failed to clone PR', { error, pr });
      return {
        success: false,
        message: `Failed to clone PR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async _startApp(prNumber: number, tempDir: string): Promise<StartResponse> {
    try {
      console.log('Starting app:', { prNumber, tempDir });

      const response = await fetch('/api/pr-testing/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prNumber,
          tempDir,
        }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server responded with ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (error) {
      logStore.logError('Failed to start application', { error, prNumber, tempDir });
      return {
        success: false,
        message: `Failed to start application: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async _stopApp(prNumber: number, pid: number, tempDir: string): Promise<StopResponse> {
    try {
      console.log('Stopping app:', { prNumber, pid, tempDir });

      const response = await fetch('/api/pr-testing/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prNumber,
          pid,
          tempDir,
        }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server responded with ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (error) {
      logStore.logError('Failed to stop application', { error, prNumber, pid, tempDir });
      return {
        success: false,
        message: `Failed to stop application: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async fetchPRCommits(pr: PullRequest): Promise<any[]> {
    this._loadToken();

    if (!this._token) {
      toast.error('GitHub token not found. Please connect your GitHub account first.');
      return [];
    }

    try {
      const response = await fetch(`https://api.github.com/repos/stackblitz-labs/bolt.diy/pulls/${pr.number}/commits`, {
        headers: {
          Authorization: `Bearer ${this._token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PR commits: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logStore.logError('Failed to fetch PR commits', { error, pr });
      throw error;
    }
  }

  async fetchPRFiles(pr: PullRequest): Promise<any[]> {
    this._loadToken();

    if (!this._token) {
      toast.error('GitHub token not found. Please connect your GitHub account first.');
      return [];
    }

    try {
      const response = await fetch(`https://api.github.com/repos/stackblitz-labs/bolt.diy/pulls/${pr.number}/files`, {
        headers: {
          Authorization: `Bearer ${this._token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PR files: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logStore.logError('Failed to fetch PR files', { error, pr });
      throw error;
    }
  }

  async isTestActive(prNumber: number): Promise<boolean> {
    await this.ensureInitialized();
    return this._activeTests.has(prNumber);
  }

  async getActiveTest(prNumber: number): Promise<{ pid?: number; tempDir?: string } | undefined> {
    await this.ensureInitialized();
    return this._activeTests.get(prNumber);
  }

  async _loadActiveTests(): Promise<void> {
    try {
      const response = await fetch('/api/pr-testing/active-tests');

      if (!response.ok) {
        throw new Error(`Failed to load active tests: ${response.statusText}`);
      }

      const activeTests = (await response.json()) as {
        success: boolean;
        data?: Array<{
          prNumber: number;
          pid: number;
          tempDir: string;
          port: number;
        }>;
      };

      if (activeTests.success && activeTests.data) {
        // Clear existing active tests
        this._activeTests.clear();

        // Add active tests from server
        activeTests.data.forEach((test) => {
          this._activeTests.set(test.prNumber, {
            pid: test.pid,
            tempDir: test.tempDir,
          });
        });

        console.log('Loaded active tests:', this._activeTests);
      }
    } catch (error) {
      logStore.logError('Failed to load active tests', { error });
      console.error('Failed to load active tests:', error);
    }
  }

  async getServerInfo(prNumber: number): Promise<{ port: number; url: string; pid: number; tempDir: string } | null> {
    try {
      const response = await fetch(`/api/pr-testing/server-info/${prNumber}`);

      if (!response.ok) {
        throw new Error(`Failed to get server info: ${response.statusText}`);
      }

      const result = (await response.json()) as {
        success: boolean;
        data?: {
          port: number;
          pid: number;
          tempDir: string;
        };
      };

      if (result.success && result.data) {
        return {
          port: result.data.port,
          url: `http://localhost:${result.data.port}`,
          pid: result.data.pid,
          tempDir: result.data.tempDir,
        };
      }

      return null;
    } catch (error) {
      logStore.logError('Failed to get server info', { error, prNumber });
      console.error('Failed to get server info:', error);

      return null;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this._initialized && this._initPromise) {
      await this._initPromise;
    }
  }

  private _addSetupLog(prNumber: number, message: string): void {
    const logs = this._setupLogs.get(prNumber) || [];
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message}`);
    this._setupLogs.set(prNumber, logs);
    console.log(`PR #${prNumber}: ${message}`);

    // Also send the log to the server
    this._sendLogToServer(prNumber, message).catch((error) => {
      console.error('Failed to send log to server:', error);
    });
  }

  private async _sendLogToServer(prNumber: number, message: string): Promise<void> {
    try {
      const response = await fetch('/api/pr-testing/add-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prNumber,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send log to server: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending log to server:', error);
    }
  }

  async getSetupLogs(prNumber: number): Promise<string[]> {
    return this._setupLogs.get(prNumber) || [];
  }

  /**
   * Checks if a PR is currently being tested
   */
  async isPRBeingTested(prNumber: number): Promise<PRTestingResult> {
    await this.ensureInitialized();

    const isActive = this._activeTests.has(prNumber);

    if (isActive) {
      return {
        success: true,
        message: `PR #${prNumber} is currently being tested`,
      };
    } else {
      return {
        success: false,
        message: `Please test the PR first before copying`,
      };
    }
  }

  /**
   * Gets the temporary directory for a PR being tested
   */
  async getTempDir(prNumber: number): Promise<PRTestingResult> {
    await this.ensureInitialized();

    const activeTest = this._activeTests.get(prNumber);

    if (!activeTest || !activeTest.tempDir) {
      return {
        success: false,
        message: `Unable to find the PR source directory`,
      };
    }

    return {
      success: true,
      message: `Found temporary directory for PR #${prNumber}`,
      data: {
        prNumber,
        tempDir: activeTest.tempDir,
      },
    };
  }

  /**
   * Sets up a PR for development by providing instructions to copy files manually
   */
  async setupForDevelopment(pr: PullRequest, destination: string): Promise<PRTestingResult> {
    try {
      await this.ensureInitialized();

      // Add setup log
      this._addSetupLog(pr.number, `Setting up PR #${pr.number} for manual copying to ${destination}`);

      // Get the active test information
      const activeTest = this._activeTests.get(pr.number);

      if (!activeTest || !activeTest.tempDir) {
        const errorMsg = `No active test found for PR #${pr.number}. Please test the PR first.`;
        this._addSetupLog(pr.number, errorMsg);

        return {
          success: false,
          message: errorMsg,
        };
      }

      const tempDir = activeTest.tempDir;

      // Normalize the destination path
      let normalizedDestination = destination;

      // Handle tilde expansion for home directory
      if (normalizedDestination.startsWith('~')) {
        const homePath = process.env.HOME || '';
        normalizedDestination = normalizedDestination.replace(/^~/, homePath);
        this._addSetupLog(pr.number, `Expanded path to: ${normalizedDestination}`);
      }

      // Check if destination path might cause permission issues
      const isRootLevel =
        normalizedDestination.startsWith('/') && normalizedDestination.split('/').filter(Boolean).length === 1;

      if (isRootLevel) {
        const warningMsg = `WARNING: The path "${normalizedDestination}" is a root-level directory and may require admin privileges. Consider using a path in your home directory instead.`;
        this._addSetupLog(pr.number, warningMsg);
      }

      // Provide instructions for manual copying
      this._addSetupLog(pr.number, `Please copy files manually from ${tempDir} to ${normalizedDestination}`);

      // Try to copy to clipboard
      try {
        const platform = window.navigator.platform.toLowerCase();
        const isWin = platform.includes('win');

        let copyCommand = '';

        if (isWin) {
          // Windows command
          copyCommand = `xcopy "${tempDir}\\*" "${normalizedDestination}\\" /E /I /H /Y`;
        } else {
          // Unix command - ensure the destination directory exists first
          copyCommand = `mkdir -p "${normalizedDestination}" && cp -R "${tempDir}/"* "${normalizedDestination}/"`;
        }

        // Copy the command to clipboard
        navigator.clipboard
          .writeText(copyCommand)
          .then(() => {
            this._addSetupLog(pr.number, `Copy command has been copied to clipboard`);
          })
          .catch((err) => {
            this._addSetupLog(pr.number, `Could not copy command to clipboard: ${err}`);
          });

        // Final success message with additional guidance
        let successMsg = `Ready to copy PR #${pr.number} files from ${tempDir} to ${normalizedDestination}. Please paste and run the copied command in your terminal.`;

        // Add extra guidance for macOS users
        if (!isWin) {
          successMsg += ` If you encounter a "Read-only file system" error, make sure to use a path in your home directory like ~/Desktop/bolt-pr-${pr.number} instead of /Desktop/bolt-pr-${pr.number}.`;
        }

        this._addSetupLog(pr.number, successMsg);

        return {
          success: true,
          message: successMsg,
          data: {
            prNumber: pr.number,
            tempDir,
            copyCommand,
          },
        };
      } catch (error) {
        const errorMsg = `Error preparing copy command: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this._addSetupLog(pr.number, errorMsg);

        return {
          success: false,
          message: errorMsg,
        };
      }
    } catch (error) {
      const errorMsg = `Failed to prepare for file copying: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this._addSetupLog(pr.number, errorMsg);
      logStore.logError('Failed to prepare for file copying', { error, pr });

      return {
        success: false,
        message: errorMsg,
      };
    }
  }
}
