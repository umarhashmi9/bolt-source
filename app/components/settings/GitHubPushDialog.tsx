import React, { useEffect } from 'react';
import type { GitHubPushProgress } from '~/lib/stores/workbench';
import { DialogRoot } from '~/components/ui/Dialog';

interface GitHubPushDialogProps {
  progress: GitHubPushProgress;
  onClose: () => void;
}

export function GitHubPushDialog({ progress, onClose }: GitHubPushDialogProps) {
  useEffect(() => {
    if (progress.stage === 'committing' && progress.color === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [progress.stage, progress.color, onClose]);

  return (
    <DialogRoot open={true} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-bolt-elements-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {progress.icon === 'spinner' && <div className="i-ph:spinner-gap-bold animate-spin text-xl" />}
                {progress.icon === 'check' && <div className="i-ph:check-circle-bold text-xl text-green-500" />}
                {progress.icon === 'warning' && <div className="i-ph:warning-bold text-xl text-yellow-500" />}
                {progress.icon === 'error' && <div className="i-ph:x-circle-bold text-xl text-red-500" />}
                {progress.icon === 'github' && <div className="i-ph:github-logo-bold text-xl" />}
                <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                  {progress.stage === 'preparing' && 'Preparing Files'}
                  {progress.stage === 'uploading' && 'Uploading to GitHub'}
                  {progress.stage === 'committing' && 'Creating Commit'}
                </h3>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary transition-colors"
                >
                  <span className="i-ph:x-bold text-xl" />
                </button>
              )}
            </div>

            {/* Progress Details */}
            <div className="space-y-3">
              <div className="text-sm text-bolt-elements-textSecondary">
                {progress.details}
                {progress.subText && (
                  <div className="mt-1 text-xs text-bolt-elements-textTertiary">{progress.subText}</div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-bolt-elements-background-depth-1 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    progress.color === 'success'
                      ? 'bg-green-500'
                      : progress.color === 'warning'
                        ? 'bg-yellow-500'
                        : progress.color === 'error'
                          ? 'bg-red-500'
                          : 'bg-bolt-elements-accent'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              {/* File Progress */}
              {progress.currentFile && (
                <div className="text-xs text-bolt-elements-textTertiary space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="i-ph:file-text text-[1.1em]" />
                    <span className="truncate">{progress.currentFile}</span>
                  </div>
                  {progress.uploadedFiles !== undefined && progress.totalFiles !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="i-ph:files text-[1.1em]" />
                      <span>
                        {progress.uploadedFiles} / {progress.totalFiles} files
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {progress.error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-2 text-sm text-red-500">
                    <span className="i-ph:warning-circle mt-0.5" />
                    <span>{progress.error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogRoot>
  );
}
