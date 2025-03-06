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

  private constructor() {
    // Initialize the service
    this._loadToken();
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
      // Check if there's already an active test for this PR
      if (this._activeTests.has(pr.number)) {
        return {
          success: false,
          message: `A test is already running for PR #${pr.number}`,
        };
      }

      // Clone the PR
      const cloneResponse = await this._clonePR(pr);

      if (!cloneResponse.success || !cloneResponse.data) {
        return {
          success: false,
          message: cloneResponse.message,
        };
      }

      // Start the application
      const startResponse = await this._startApp(pr.number, cloneResponse.data.tempDir);

      if (!startResponse.success || !startResponse.data) {
        return {
          success: false,
          message: startResponse.message,
        };
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
      logStore.logError('Failed to test PR', { error, pr });
      return {
        success: false,
        message: `Failed to test PR #${pr.number}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async stopTest(prNumber: number): Promise<PRTestingResult> {
    try {
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

  isTestActive(prNumber: number): boolean {
    return this._activeTests.has(prNumber);
  }

  getActiveTest(prNumber: number): { pid?: number; tempDir?: string } | undefined {
    return this._activeTests.get(prNumber);
  }
}
