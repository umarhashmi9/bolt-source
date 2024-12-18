import { toast } from 'react-toastify';
import { ensureEncryption, lookupSavedPassword } from '~/lib/auth';

export const handleGitPush = async (
  provider: 'github' | 'gitlab',
  pushToRepo: (repoName: string, username: string, token: string) => void,
) => {
  const repoName = prompt(
    `Please enter a name for your new ${provider === 'github' ? 'GitHub' : 'GitLab'} repository:`,
    'bolt-generated-project',
  );

  if (!repoName) {
    toast.error('Repository name is required');
    return;
  }

  if (!(await ensureEncryption())) {
    toast.error('Failed to initialize secure storage');
    return;
  }

  const auth = await lookupSavedPassword(`${provider}.com`);

  if (auth?.username && auth?.password) {
    pushToRepo(repoName, auth.username, auth.password);
  } else {
    toast.info(`Please set up your ${provider === 'github' ? 'GitHub' : 'GitLab'} credentials in the Connections tab`);
  }
};

export const checkGitCredentials = async (): Promise<{ github: boolean; gitlab: boolean }> => {
  const githubAuth = await lookupSavedPassword('github.com');
  const gitlabAuth = await lookupSavedPassword('gitlab.com');

  return {
    github: !!(githubAuth?.username && githubAuth?.password),
    gitlab: !!(gitlabAuth?.username && gitlabAuth?.password),
  };
};
