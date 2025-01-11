# Sync Implementation

## Overview

The sync functionality allows users to synchronize their project files with a local directory. It includes features like persistent project folders, configurable auto-sync, and detailed sync history tracking.

## Key Features

### 1. Persistent Project Folders

- Each project gets its own dedicated folder named after the project
- Folders are reused across sessions for consistency
- Missing folders are automatically created
- Folder mappings are stored in settings for persistence

### 2. Configurable Auto-Sync

- Users can set auto-sync intervals from 1 minute to 1 hour
- System checks every 30 seconds to determine if sync is needed
- Syncs only occur if sufficient time has passed since last sync
- Auto-sync settings are persisted across sessions

### 3. Sync Settings

- **Auto Sync**: Enable/disable automatic synchronization
- **Sync Interval**: Configure sync frequency (1min - 1hr)
- **Sync on Save**: Option to sync when files are saved
- **Sync Mode**: Choose between:
  - Ask: Prompt for action on conflicts
  - Overwrite: Always overwrite existing files
  - Skip: Skip conflicting files
- **Exclude Patterns**: Specify patterns for files to exclude from sync

### 4. Sync Statistics & History

- Tracks detailed statistics for each sync operation:
  - Total files synced
  - Total size transferred
  - Duration of sync
  - Timestamp
- Maintains sync history with:
  - Project name
  - Sync status (success/partial/failed)
  - List of synced files
  - Sync statistics
- History is persisted in localStorage (last 100 entries)

## Technical Implementation

### Data Structures

#### Sync Statistics

```typescript
interface SyncStatistics {
  totalFiles: number;
  totalSize: number;
  duration: number;
  timestamp: number;
}
```

#### Sync History Entry

```typescript
interface SyncHistoryEntry {
  id: string;
  projectName: string;
  timestamp: number;
  statistics: SyncStatistics;
  files: string[];
  status: 'success' | 'partial' | 'failed';
}
```

#### Project Sync Info

```typescript
interface ProjectSyncInfo {
  projectName: string;
  folderName: string;
  lastSync: number;
}
```

#### Sync Settings

```typescript
interface SyncSettings {
  autoSync: boolean;
  autoSyncInterval: number;
  syncOnSave: boolean;
  excludePatterns: string[];
  syncMode: 'ask' | 'overwrite' | 'skip';
  projectFolders: Record<string, ProjectSyncInfo>;
}
```

### Key Components

1. **WorkbenchStore**

   - Manages sync state and operations
   - Handles folder selection and verification
   - Implements sync logic and conflict resolution
   - Maintains sync settings and history

2. **SyncTab Component**

   - Provides UI for sync settings configuration
   - Displays current sync folder and status
   - Allows management of exclude patterns
   - Shows sync statistics

3. **SyncStats Component**
   - Displays latest sync information
   - Shows historical sync data
   - Updates in real-time as new syncs occur

### Sync Process

1. **Initialization**

   - Load saved sync settings
   - Restore project folder mapping
   - Initialize sync session
   - Set up auto-sync interval checker

2. **Folder Selection**

   - User selects sync folder via system dialog
   - System verifies write permissions
   - Creates test directory to confirm access
   - Updates sync folder reference

3. **Sync Operation**

   - Check exclude patterns
   - Create/verify project folder
   - Process each file:
     - Check for conflicts based on sync mode
     - Create necessary subdirectories
     - Write file contents
   - Update statistics and history
   - Show progress notifications

4. **Conflict Resolution**
   - Based on sync mode:
     - Ask: Prompt user for each conflict
     - Overwrite: Replace existing files
     - Skip: Preserve existing files

## Usage

### Setting Up Sync

1. Open Settings > Sync tab
2. Select sync folder
3. Configure sync settings:
   - Enable/disable auto-sync
   - Set sync interval
   - Choose sync mode
   - Add exclude patterns

### Manual Sync

- Click sync button to start manual sync
- Monitor progress in notifications
- View sync results in statistics panel

### Viewing History

- Check latest sync details in statistics panel
- Review historical syncs in scrollable list
- Monitor sync status indicators:
  - ✓ Success
  - ⚠ Partial (some files skipped)
  - ✗ Failed
