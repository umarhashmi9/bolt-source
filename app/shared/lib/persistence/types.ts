import type { FileMap } from '~/shared/workbench/stores/files';

export interface Snapshot {
  chatIndex: string;
  files: FileMap;
  summary?: string;
}
