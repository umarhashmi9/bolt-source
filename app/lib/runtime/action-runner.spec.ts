import { ActionRunner } from './action-runner';
import type { WebContainer } from '@webcontainer/api';
import { ActionRunner } from './action-runner';
import type { WebContainer } from '@webcontainer/api';
import type { BoltShell } from '~/utils/shell';
import { vi, describe, beforeEach, test, expect } from 'vitest';

// Import the modules to be mocked
import * as fileLocksUtil from '~/utils/fileLocks';
import * as loggerUtil from '~/utils/logger';
import { path as nodePath } from '~/utils/path'; // Keep if used, otherwise remove

// Hoist the vi.fn() instances. This ensures they are initialized before vi.mock factories.
const mockIsFileLocked = vi.hoisted(() => vi.fn());
const mockGetCurrentChatId = vi.hoisted(() => vi.fn());

// Hoist individual logger mock functions
const mockLoggerDebug = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());
const mockLoggerInfo = vi.hoisted(() => vi.fn());
const mockLoggerWarn = vi.hoisted(() => vi.fn());

// Group them in an object for the mock factory, and hoist the object itself
const loggerInstanceMocks = vi.hoisted(() => ({
  debug: mockLoggerDebug,
  error: mockLoggerError,
  info: mockLoggerInfo,
  warn: mockLoggerWarn,
}));

const mockWriteFile = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());

// Mock factories now refer to the hoisted vi.fn() instances
vi.mock('~/utils/fileLocks', () => ({
  isFileLocked: mockIsFileLocked,
  getCurrentChatId: mockGetCurrentChatId,
}));

vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => loggerInstanceMocks,
}));

// Mock for webcontainer fs
const mockWebContainer = {
  fs: {
    writeFile: mockWriteFile,
    readFile: mockReadFile,
    mkdir: mockMkdir,
  },
  workdir: '/app',
} as unknown as WebContainer;

// Path mock
vi.mock('~/utils/path', () => ({
  path: {
    relative: require('path').relative,
    dirname: require('path').dirname,
    join: require('path').join,
  },
}));

describe('ActionRunner #runFileAction', () => {
  let actionRunner: ActionRunner;
  let mockShellTerminal: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mock functions
    mockIsFileLocked.mockReset();
    mockGetCurrentChatId.mockReset();
    mockLoggerDebug.mockReset(); // Reset individual hoisted logger mocks
    mockLoggerError.mockReset();
    mockLoggerInfo.mockReset();
    mockLoggerWarn.mockReset();
    mockWriteFile.mockReset();
    mockReadFile.mockReset();
    mockMkdir.mockReset();

    mockShellTerminal = vi.fn();
    actionRunner = new ActionRunner(
      Promise.resolve(mockWebContainer),
      mockShellTerminal,
    );
    // Suppress console output from logger during tests if necessary
    // loggerInstanceMocks.debug.mockImplementation(() => {});
    // loggerInstanceMocks.error.mockImplementation(() => {});
  });

  const baseAction = {
    type: 'file' as const,
    filePath: '/app/test.txt',
    content: 'Hello, world!',
    changeSource: 'user',
    actionId: 'test-action-id',
    status: 'pending' as const,
    executed: false,
    abort: vi.fn(),
    abortSignal: new AbortController().signal,
  };

  test('Test Case 1: File is locked', async () => {
    mockIsFileLocked.mockReturnValue(true);
    mockGetCurrentChatId.mockReturnValue('chat123');

    // Private method access workaround
    await (actionRunner as any)._ActionRunner__runFileAction(baseAction);

    expect(mockIsFileLocked).toHaveBeenCalledWith('test.txt', 'chat123');
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(loggerInstanceMocks.debug).toHaveBeenCalledWith('File test.txt is locked, skipping write.');
  });

  test('Test Case 2: File content is identical', async () => {
    mockIsFileLocked.mockReturnValue(false);
    mockGetCurrentChatId.mockReturnValue('chat123');
    mockReadFile.mockResolvedValue(baseAction.content);

    await (actionRunner as any)._ActionRunner__runFileAction(baseAction);

    expect(mockIsFileLocked).toHaveBeenCalledWith('test.txt', 'chat123');
    expect(mockReadFile).toHaveBeenCalledWith('test.txt', 'utf-8');
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(loggerInstanceMocks.debug).toHaveBeenCalledWith('File test.txt content unchanged, skipping write.');
  });

  test('Test Case 3: File content is different', async () => {
    mockIsFileLocked.mockReturnValue(false);
    mockGetCurrentChatId.mockReturnValue('chat123');
    mockReadFile.mockResolvedValue('Old content');

    await (actionRunner as any)._ActionRunner__runFileAction(baseAction);

    expect(mockIsFileLocked).toHaveBeenCalledWith('test.txt', 'chat123');
    expect(mockReadFile).toHaveBeenCalledWith('test.txt', 'utf-8');
    expect(mockWriteFile).toHaveBeenCalledWith('test.txt', baseAction.content);
    expect(loggerInstanceMocks.debug).toHaveBeenCalledWith('File written test.txt');
  });

  test('Test Case 4: File is new (readFile throws an error)', async () => {
    mockIsFileLocked.mockReturnValue(false);
    mockGetCurrentChatId.mockReturnValue('chat123');
    mockReadFile.mockRejectedValue(new Error('File not found'));

    await (actionRunner as any)._ActionRunner__runFileAction(baseAction);

    expect(mockIsFileLocked).toHaveBeenCalledWith('test.txt', 'chat123');
    expect(mockReadFile).toHaveBeenCalledWith('test.txt', 'utf-8');
    expect(loggerInstanceMocks.debug).toHaveBeenCalledWith('File test.txt not found, creating new file.');
    expect(mockWriteFile).toHaveBeenCalledWith('test.txt', baseAction.content);
    expect(loggerInstanceMocks.debug).toHaveBeenCalledWith('File written test.txt');
  });

  test('Test Case 5: Folder creation', async () => {
    mockIsFileLocked.mockReturnValue(false);
    mockGetCurrentChatId.mockReturnValue('chat123');
    mockReadFile.mockRejectedValue(new Error('File not found'));
    const filePathWithFolder = '/app/some/new/folder/file.txt';
    const actionWithFolder = {
      ...baseAction,
      filePath: filePathWithFolder,
    };

    await (actionRunner as any)._ActionRunner__runFileAction(actionWithFolder);

    const relativePath = 'some/new/folder/file.txt';
    const folderPath = 'some/new/folder';

    expect(mockIsFileLocked).toHaveBeenCalledWith(relativePath, 'chat123');
    expect(mockReadFile).toHaveBeenCalledWith(relativePath, 'utf-8');
    expect(loggerInstanceMocks.debug).toHaveBeenCalledWith(`File ${relativePath} not found, creating new file.`);
    expect(mockMkdir).toHaveBeenCalledWith(folderPath, { recursive: true });
    expect(mockWriteFile).toHaveBeenCalledWith(relativePath, actionWithFolder.content);
    expect(loggerInstanceMocks.debug).toHaveBeenCalledWith(`File written ${relativePath}`);
  });
});
