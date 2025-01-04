import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import Cookies from 'js-cookie';
import { extractRelativePath } from '~/utils/diff';

export class GitHubService {
  private async _getOctokit(githubUsername?: string, ghToken?: string) {
    const githubToken = ghToken || Cookies.get('githubToken');
    const owner = githubUsername || Cookies.get('githubUsername');

    if (!githubToken || !owner) {
      throw new Error('GitHub token or username is not set in cookies or provided.');
    }

    return { octokit: new Octokit({ auth: githubToken }), owner };
  }

  private async _waitForVisibilityChange(
    octokit: Octokit,
    owner: string,
    repoName: string,
    expectedPrivate: boolean,
    maxAttempts = 10,
  ): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const { data: repo } = await octokit.repos.get({
          owner,
          repo: repoName,
        });

        if (repo.private === expectedPrivate) {
          return true;
        }
      } catch (error) {
        console.error('Error checking repository visibility:', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
  }

  async updateRepoVisibility(repoName: string, isPrivate: boolean, githubUsername?: string, ghToken?: string) {
    try {
      const { octokit, owner } = await this._getOctokit(githubUsername, ghToken);

      try {
        // Check if repo exists
        const { data: repo } = await octokit.repos.get({
          owner,
          repo: repoName,
        });

        if (repo.private === isPrivate) {
          return { ...repo, message: `Repository is already ${isPrivate ? 'private' : 'public'}` };
        }

        // Update visibility
        console.log(`Updating repository visibility to ${isPrivate ? 'private' : 'public'}`);
        await octokit.repos.update({
          owner,
          repo: repoName,
          private: isPrivate,
        });

        // Wait for visibility change to be confirmed
        const visibilityUpdated = await this._waitForVisibilityChange(octokit, owner, repoName, isPrivate);

        if (visibilityUpdated) {
          console.log('Repository visibility update confirmed');

          const { data: updatedRepo } = await octokit.repos.get({
            owner,
            repo: repoName,
          });

          return { ...updatedRepo, message: `Repository visibility updated to ${isPrivate ? 'private' : 'public'}` };
        } else {
          throw new Error('Repository visibility update could not be confirmed');
        }
      } catch (error) {
        if (error instanceof Error && 'status' in error && error.status === 404) {
          // Create new repository if it doesn't exist
          const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            private: isPrivate,
            auto_init: true,
          });

          // Wait for repository to be accessible
          const repoReady = await this._waitForVisibilityChange(octokit, owner, repoName, isPrivate);

          if (!repoReady) {
            throw new Error('Repository creation could not be confirmed');
          }

          return { ...newRepo, message: 'New repository created successfully' };
        }

        throw error;
      }
    } catch (error) {
      console.error('Error updating repository visibility:', error);
      throw error;
    }
  }

  async pushToGitHub(
    files: Record<string, any>,
    repoName: string,
    githubUsername?: string,
    ghToken?: string,
    force: boolean = true,
    isPrivate: boolean = false,
  ) {
    const { octokit, owner } = await this._getOctokit(githubUsername, ghToken);

    // Get repository info
    let repo: RestEndpointMethodTypes['repos']['get']['response']['data'];

    try {
      const { data: existingRepo } = await octokit.repos.get({
        owner,
        repo: repoName,
      });
      repo = existingRepo;
    } catch {
      // If repo doesn't exist, create it with the specified visibility
      try {
        const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          private: isPrivate,
          auto_init: true,
        });

        // Wait for repository to be accessible
        const repoReady = await this._waitForVisibilityChange(octokit, owner, repoName, isPrivate);

        if (!repoReady) {
          throw new Error('Repository creation could not be confirmed');
        }

        repo = newRepo;
      } catch (createError) {
        const errorMessage =
          createError instanceof Error ? createError.message : 'Unknown error occurred while creating repository';
        throw new Error(`Failed to create repository: ${errorMessage}`);
      }
    }

    if (!files || Object.keys(files).length === 0) {
      return { ...repo, message: 'No files to push.' };
    }

    try {
      // Create blobs for new files
      const blobs = await Promise.all(
        Object.entries(files).map(async ([filePath, dirent]) => {
          if (dirent?.type === 'file' && dirent.content) {
            const { data: blob } = await octokit.git.createBlob({
              owner: repo.owner.login,
              repo: repo.name,
              content: Buffer.from(dirent.content).toString('base64'),
              encoding: 'base64',
            });

            // Use extractRelativePath to ensure we don't have leading slashes
            return { path: extractRelativePath(filePath), sha: blob.sha };
          }

          return null;
        }),
      );

      const validBlobs = blobs.filter(Boolean);

      if (validBlobs.length === 0) {
        return { ...repo, message: 'No valid files to push.' };
      }

      // Get current commit and ensure we have the latest
      const defaultBranch = repo.default_branch || 'main';
      const { data: ref } = await octokit.git.getRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${defaultBranch}`,
      });

      // Create new tree
      const { data: newTree } = await octokit.git.createTree({
        owner: repo.owner.login,
        repo: repo.name,
        base_tree: ref.object.sha,
        tree: validBlobs.map((blob) => ({
          path: blob!.path,
          mode: '100644',
          type: 'blob',
          sha: blob!.sha,
        })),
      });

      // Create new commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner: repo.owner.login,
        repo: repo.name,
        message: 'Update from Bolt',
        tree: newTree.sha,
        parents: [ref.object.sha],
      });

      // Update reference with force flag if specified
      await octokit.git.updateRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${defaultBranch}`,
        sha: newCommit.sha,
        force,
      });

      return {
        ...repo,
        message: 'Successfully pushed changes to GitHub',
        commitSha: newCommit.sha,
      };
    } catch (error: any) {
      throw new Error(`Failed to push to GitHub: ${error.message}`);
    }
  }
}
