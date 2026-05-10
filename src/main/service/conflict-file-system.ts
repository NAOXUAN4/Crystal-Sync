import { PhysicalFileSystem } from 'webdav-server/lib/index.v2';
import { SyncRecordStore } from './sync-record-store';
import * as fs from 'fs';
import * as path from 'path';

export interface ConflictEvent {
  filePath: string;
  localPath: string;
  cachePath: string;
  localMtime: number;
}

type ConflictCallback = (event: ConflictEvent) => void;

export class ConflictFileSystem extends PhysicalFileSystem {
  private syncStore: SyncRecordStore;
  private onConflict: ConflictCallback | null = null;

  constructor(rootPath: string, syncStore: SyncRecordStore) {
    super(rootPath);
    this.syncStore = syncStore;
  }

  setOnConflict(cb: ConflictCallback): void {
    this.onConflict = cb;
  }

  // override _openWriteStream to intercept PUT
  _openWriteStream(webPath: any, ctx: any, callback: any): void {
    const { realPath } = (this as any).getRealPath(webPath);
    const filePath = webPath.toString();

    // check local file mtime
    fs.stat(realPath, (err: NodeJS.ErrnoException | null, stat: fs.Stats) => {
      if (err) {
        // file doesn't exist locally → new file, no conflict
        this.syncStore.updateLastSyncTime(filePath, Date.now());
        return super._openWriteStream(webPath, ctx, callback);
      }

      const lastSyncTime = this.syncStore.getLastSyncTime(filePath);

      if (!lastSyncTime || stat.mtimeMs <= lastSyncTime) {
        // no conflict: local wasn't modified since last sync
        this.syncStore.updateLastSyncTime(filePath, Date.now());
        return super._openWriteStream(webPath, ctx, callback);
      }

      // CONFLICT: local was modified after last sync
      const cachePath = this.getCachePath(filePath);
      const cacheDir = path.dirname(cachePath);

      fs.mkdir(cacheDir, { recursive: true }, (_mkdirErr) => {
        fs.open(cachePath, 'w+', (openErr, fd) => {
          if (openErr) {
            console.error('Failed to open cache file:', openErr);
            // fall back to normal write so sync doesn't break
            this.syncStore.updateLastSyncTime(filePath, Date.now());
            return super._openWriteStream(webPath, ctx, callback);
          }

          // register resource so the framework tracks it
          if (!(this as any).resources[filePath]) {
            (this as any).resources[filePath] = {};
          }

          // update sync record (mobile version is "the latest sync" even if cached)
          this.syncStore.updateLastSyncTime(filePath, Date.now());

          // notify
          if (this.onConflict) {
            this.onConflict({
              filePath,
              localPath: realPath,
              cachePath,
              localMtime: stat.mtimeMs,
            });
          }

          console.log(`CONFLICT: ${filePath} → cached to ${cachePath}`);
          const stream = fs.createWriteStream(null, { fd });
          callback(null, stream);
        });
      });
    });
  }

  private getCachePath(filePath: string): string {
    const relativePath = filePath.replace(/^\/+/, '');
    return path.join(this.rootPath, '.sync-cache', relativePath + '_mobile.md');
  }
}
