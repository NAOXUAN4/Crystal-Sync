import { PhysicalFileSystem } from 'webdav-server/lib/index.v2';
import * as fs from 'fs';
import * as path from 'path';

export interface SnapshotEvent {
  filePath: string;
  localPath: string;
  snapshotPath: string;
  timestamp: number;
}

type SnapshotCallback = (event: SnapshotEvent) => void;

function timestampId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export class VersionedFileSystem extends PhysicalFileSystem {
  private onSnapshot: SnapshotCallback | null = null;

  constructor(rootPath: string) {
    super(rootPath);
  }

  setOnSnapshot(cb: SnapshotCallback): void {
    this.onSnapshot = cb;
  }

  _openWriteStream(webPath: any, ctx: any, callback: any): void {
    const { realPath } = (this as any).getRealPath(webPath);
    const filePath = webPath.toString();

    fs.stat(realPath, (err: NodeJS.ErrnoException | null, stat: fs.Stats) => {
      if (err) {
        // new file — no snapshot needed
        return super._openWriteStream(webPath, ctx, callback);
      }

      // snapshot current version before overwriting
      const relativePath = filePath.replace(/^\/+/, '');
      const snapshotDir = path.join(this.rootPath, '.sync-history', path.dirname(relativePath));
      const snapshotName = timestampId() + '.md';
      const snapshotPath = path.join(snapshotDir, path.basename(relativePath), snapshotName);

      const readStream = fs.createReadStream(realPath);
      const writeSnapshot = () => {
        fs.mkdir(path.dirname(snapshotPath), { recursive: true }, (_mkdirErr) => {
          const snapshotStream = fs.createWriteStream(snapshotPath);
          readStream.pipe(snapshotStream);

          snapshotStream.on('finish', () => {
            if (this.onSnapshot) {
              this.onSnapshot({
                filePath,
                localPath: realPath,
                snapshotPath,
                timestamp: Date.now(),
              });
            }
            console.log(`SNAPSHOT: ${filePath} → ${snapshotPath}`);
          });

          snapshotStream.on('error', (e) => {
            console.error('Snapshot write failed:', e);
          });
        });
      };

      writeSnapshot();

      // always allow the PUT through
      super._openWriteStream(webPath, ctx, callback);
    });
  }
}
