import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { logStore } from '~/lib/stores/logs';
import { classNames } from '~/utils/classNames';
import { formatDistanceToNow } from 'date-fns';
import { PRTestingService } from './PRTestingService';
import type { PullRequest } from './types';
import {
  FiGitPullRequest,
  FiGitMerge,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiRefreshCw,
  FiCode,
  FiGitCommit,
  FiFileText,
} from 'react-icons/fi';

// Custom PR icon component for better visibility
const PullRequestIcon = ({ state, className }: { state: string; className?: string }) => {
  return (
    <div
      className={classNames(
        'flex-shrink-0 rounded-full flex items-center justify-center',
        state === 'open'
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        className || 'w-6 h-6',
      )}
    >
      {state === 'open' ? <FiGitPullRequest className="w-3.5 h-3.5" /> : <FiGitMerge className="w-3.5 h-3.5" />}
    </div>
  );
};

function PrTestingTab() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'open' | 'closed'>('open');
  const [prCommits, setPRCommits] = useState<any[]>([]);
  const [prFiles, setPRFiles] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    description: boolean;
    commits: boolean;
    files: boolean;
  }>({
    description: true,
    commits: false,
    files: false,
  });
  const [testingPRs, setTestingPRs] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPullRequests();
  }, [filterState]);

  useEffect(() => {
    const prService = PRTestingService.getInstance();
    const activePRs = new Set<number>();

    pullRequests.forEach((pr) => {
      if (prService.isTestActive(pr.number)) {
        activePRs.add(pr.number);
      }
    });

    setTestingPRs(activePRs);
  }, [pullRequests]);

  const fetchPullRequests = async () => {
    setIsLoading(true);

    try {
      const prService = PRTestingService.getInstance();
      const prs = await prService.fetchPullRequests(filterState);
      setPullRequests(prs);
    } catch (error) {
      logStore.logError('Failed to fetch pull requests', { error });
      toast.error('Failed to fetch pull requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPR = async (pr: PullRequest) => {
    if (selectedPR?.number === pr.number) {
      setSelectedPR(null);
      setPRCommits([]);
      setPRFiles([]);

      return;
    }

    setSelectedPR(pr);
    setIsLoadingDetails(true);

    try {
      const prService = PRTestingService.getInstance();
      const [commits, files] = await Promise.all([prService.fetchPRCommits(pr), prService.fetchPRFiles(pr)]);

      setPRCommits(commits);
      setPRFiles(files);
    } catch (error) {
      logStore.logError('Failed to fetch PR details', { error, pr });
      toast.error('Failed to fetch PR details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleTestPR = async (pr: PullRequest) => {
    setIsCloning(true);

    try {
      const prService = PRTestingService.getInstance();
      const result = await prService.testPullRequest(pr);

      if (result.success) {
        toast.success(result.message);
        setTestingPRs((prev) => new Set(prev).add(pr.number));

        if (selectedPR?.number === pr.number) {
          await handleSelectPR(pr);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      logStore.logError('Failed to test PR', { error, pr });
      toast.error('Failed to test PR');
    } finally {
      setIsCloning(false);
    }
  };

  const handleStopTest = async (pr: PullRequest) => {
    try {
      const prService = PRTestingService.getInstance();
      const result = await prService.stopTest(pr.number);

      if (result.success) {
        toast.success(result.message);
        setTestingPRs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pr.number);

          return newSet;
        });

        if (selectedPR?.number === pr.number) {
          await handleSelectPR(pr);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      logStore.logError('Failed to stop test', { error, pr });
      toast.error('Failed to stop test');
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const filteredPRs = pullRequests.filter(
    (pr) =>
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.user.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.number.toString().includes(searchQuery),
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        className="flex items-center gap-2 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PullRequestIcon state="open" className="w-5 h-5" />
        <h2 className="text-lg font-medium text-bolt-elements-textPrimary">PR Testing</h2>
        {!isLoading && pullRequests.filter((pr) => pr.state === 'open').length > 0 && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            {pullRequests.filter((pr) => pr.state === 'open').length} open
          </span>
        )}
      </motion.div>
      <p className="text-sm text-bolt-elements-textSecondary mb-6">Test pull requests from the GitHub repository</p>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="w-4 h-4 text-bolt-elements-textSecondary" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-bolt-elements-border rounded-md bg-bolt-elements-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Search pull requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={classNames(
              'px-3 py-2 rounded-md text-sm font-medium',
              filterState === 'open'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : 'bg-bolt-elements-background text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
            )}
            onClick={() => setFilterState('open')}
          >
            Open
          </button>
          <button
            className={classNames(
              'px-3 py-2 rounded-md text-sm font-medium',
              filterState === 'closed'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                : 'bg-bolt-elements-background text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
            )}
            onClick={() => setFilterState('closed')}
          >
            Closed
          </button>
          <button
            className={classNames(
              'px-3 py-2 rounded-md text-sm font-medium',
              filterState === 'all'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
                : 'bg-bolt-elements-background text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
            )}
            onClick={() => setFilterState('all')}
          >
            All
          </button>
          <button
            className="px-3 py-2 rounded-md text-sm font-medium bg-bolt-elements-background text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
            onClick={fetchPullRequests}
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pull Requests List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin w-8 h-8 text-purple-500">
            <FiRefreshCw className="w-8 h-8" />
          </div>
        </div>
      ) : filteredPRs.length === 0 ? (
        <div className="text-center py-12 text-bolt-elements-textSecondary">
          {searchQuery ? 'No pull requests match your search' : 'No pull requests found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPRs.map((pr) => (
            <motion.div
              key={pr.number}
              className="bg-bolt-elements-card rounded-lg border border-bolt-elements-border p-4 hover:border-purple-500/50 transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleSelectPR(pr)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <PullRequestIcon state={pr.state} className="w-6 h-6" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-bolt-elements-textPrimary">{pr.title}</h3>
                      <span className="text-xs text-bolt-elements-textSecondary">#{pr.number}</span>
                      {testingPRs.has(pr.number) && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Testing
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary mt-1">
                      Opened by{' '}
                      <a
                        href={pr.user.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-500 hover:underline"
                      >
                        {pr.user.login}
                      </a>{' '}
                      {formatDistanceToNow(new Date(pr.created_at))} ago
                    </div>
                    {pr.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pr.labels.map((label) => (
                          <span
                            key={label.name}
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: `#${label.color}20`,
                              color: `#${label.color}`,
                              border: `1px solid #${label.color}40`,
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md bg-bolt-elements-background text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                  {testingPRs.has(pr.number) ? (
                    <button
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStopTest(pr);
                      }}
                    >
                      Stop Test
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestPR(pr);
                      }}
                      disabled={isCloning}
                    >
                      {isCloning ? (
                        <div className="animate-spin w-4 h-4">
                          <FiRefreshCw className="w-4 h-4" />
                        </div>
                      ) : (
                        <span>Test PR</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {selectedPR?.number === pr.number && (
                <motion.div
                  className="mt-4 pt-4 border-t border-bolt-elements-border"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {isLoadingDetails ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin w-6 h-6 text-purple-500">
                        <FiRefreshCw className="w-6 h-6" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Description Section */}
                      <div className="mb-4">
                        <div
                          className="flex items-center justify-between cursor-pointer py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection('description');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <FiFileText className="w-4 h-4 text-purple-500" />
                            <h4 className="text-sm font-medium text-bolt-elements-textPrimary">Description</h4>
                          </div>
                          {expandedSections.description ? (
                            <FiChevronUp className="w-4 h-4 text-bolt-elements-textSecondary" />
                          ) : (
                            <FiChevronDown className="w-4 h-4 text-bolt-elements-textSecondary" />
                          )}
                        </div>

                        {expandedSections.description && (
                          <div className="text-sm text-bolt-elements-textSecondary whitespace-pre-line p-3 bg-bolt-elements-background rounded-md">
                            {pr.body || 'No description provided.'}
                          </div>
                        )}
                      </div>

                      {/* PR Commits */}
                      {prCommits.length > 0 && (
                        <div className="mb-4">
                          <div
                            className="flex items-center justify-between cursor-pointer py-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSection('commits');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <FiGitCommit className="w-4 h-4 text-purple-500" />
                              <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                                Commits ({prCommits.length})
                              </h4>
                            </div>
                            {expandedSections.commits ? (
                              <FiChevronUp className="w-4 h-4 text-bolt-elements-textSecondary" />
                            ) : (
                              <FiChevronDown className="w-4 h-4 text-bolt-elements-textSecondary" />
                            )}
                          </div>

                          {expandedSections.commits && (
                            <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-bolt-elements-background rounded-md">
                              {prCommits.map((commit) => (
                                <div
                                  key={commit.sha}
                                  className="text-xs p-2 rounded-md bg-bolt-elements-card border border-bolt-elements-border"
                                >
                                  <div className="flex items-center gap-2">
                                    <FiGitCommit className="w-3.5 h-3.5 text-bolt-elements-textSecondary" />
                                    <a
                                      href={commit.html_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-purple-500 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {commit.sha.substring(0, 7)}
                                    </a>
                                    <span className="text-bolt-elements-textPrimary">
                                      {commit.commit.message.split('\n')[0]}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-bolt-elements-textSecondary">
                                    by {commit.author?.login || commit.commit.author.name} •{' '}
                                    {formatDistanceToNow(new Date(commit.commit.author.date))} ago
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PR Files */}
                      {prFiles.length > 0 && (
                        <div className="mb-4">
                          <div
                            className="flex items-center justify-between cursor-pointer py-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSection('files');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <FiCode className="w-4 h-4 text-purple-500" />
                              <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                                Changed Files ({prFiles.length})
                              </h4>
                            </div>
                            {expandedSections.files ? (
                              <FiChevronUp className="w-4 h-4 text-bolt-elements-textSecondary" />
                            ) : (
                              <FiChevronDown className="w-4 h-4 text-bolt-elements-textSecondary" />
                            )}
                          </div>

                          {expandedSections.files && (
                            <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-bolt-elements-background rounded-md">
                              {prFiles.map((file) => (
                                <div
                                  key={file.filename}
                                  className="text-xs p-2 rounded-md bg-bolt-elements-card border border-bolt-elements-border"
                                >
                                  <div className="flex items-center gap-2">
                                    <FiCode className="w-3.5 h-3.5 text-bolt-elements-textSecondary" />
                                    <a
                                      href={file.blob_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-500 hover:underline truncate max-w-[200px] md:max-w-[300px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {file.filename}
                                    </a>
                                    <span
                                      className={classNames(
                                        'px-1.5 py-0.5 rounded-full text-[10px]',
                                        file.status === 'added'
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                          : file.status === 'removed'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                                      )}
                                    >
                                      {file.status}
                                    </span>
                                    <span className="text-bolt-elements-textSecondary">
                                      +{file.additions} -{file.deletions}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Test Status */}
                      {testingPRs.has(pr.number) && (
                        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-md">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                            <div className="animate-pulse w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-medium">Testing in progress</span>
                          </div>
                          <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                            The PR is currently being tested. You can stop the test at any time.
                          </p>
                          <div className="mt-3">
                            <button
                              className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopTest(pr);
                              }}
                            >
                              Stop Test
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-bolt-elements-background text-bolt-elements-textPrimary hover:bg-bolt-elements-backgroundHover transition-colors flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiExternalLink className="w-3.5 h-3.5" />
                          <span>View on GitHub</span>
                        </a>
                        {testingPRs.has(pr.number) ? (
                          <button
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStopTest(pr);
                            }}
                          >
                            <FiRefreshCw className="w-3.5 h-3.5" />
                            <span>Stop Test</span>
                          </button>
                        ) : (
                          <button
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 transition-colors flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestPR(pr);
                            }}
                            disabled={isCloning}
                          >
                            {isCloning ? (
                              <div className="animate-spin w-3.5 h-3.5">
                                <FiRefreshCw className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <>
                                <FiCode className="w-3.5 h-3.5" />
                                <span>Test PR</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PrTestingTab;
