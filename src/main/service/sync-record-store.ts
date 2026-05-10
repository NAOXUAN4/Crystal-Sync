import * as fs from 'fs';
import * as path from 'path';

// Tracks last sync mtime per file, persisted as JSON in the vault directory.
export class SyncRecordStore {
  private records: Record<string, number> = {};
  private storePath: string;

  constructor(vaultPath: string) {
    this.storePath = path.join(vaultPath, '.sync-records.json');
    this.load();
  }

  getLastSyncTime(filePath: string): number | undefined {
    return this.records[filePath];
  }

  updateLastSyncTime(filePath: string, time: number): void {
    this.records[filePath] = time;
    this.save();
  }

  removeRecord(filePath: string): void {
    delete this.records[filePath];
    this.save();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        this.records = JSON.parse(fs.readFileSync(this.storePath, 'utf-8'));
      }
    } catch {
      this.records = {};
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save sync records:', e);
    }
  }
}
