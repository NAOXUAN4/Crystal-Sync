// WebDAV test server with version snapshot
const { WebDAVServer } = require('webdav-server/lib/index.v2');
const { PhysicalFileSystem } = require('webdav-server/lib/index.v2');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Timestamped snapshot ID
function timestampId() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

// ---- VersionedFileSystem ----
class VersionedFileSystem extends PhysicalFileSystem {
  constructor(rootPath) {
    super(rootPath);
  }

  _openWriteStream(webPath, ctx, callback) {
    const { realPath } = this.getRealPath(webPath);
    const filePath = webPath.toString();

    fs.stat(realPath, (err, stat) => {
      if (err) {
        // new file — no snapshot needed
        console.log(`  [NEW] ${filePath} — first time sync`);
        return super._openWriteStream(webPath, ctx, callback);
      }

      // snapshot current version before overwriting
      const relativePath = filePath.replace(/^\/+/, '');
      const snapshotDir = path.join(this.rootPath, '.sync-history', path.dirname(relativePath));
      const snapshotName = timestampId() + '.md';
      const snapshotPath = path.join(snapshotDir, path.basename(relativePath), snapshotName);

      fs.mkdir(path.dirname(snapshotPath), { recursive: true }, (_mkdirErr) => {
        const readStream = fs.createReadStream(realPath);
        const snapshotStream = fs.createWriteStream(snapshotPath);
        readStream.pipe(snapshotStream);

        snapshotStream.on('finish', () => {
          console.log(`  SNAPSHOT: ${filePath} → ${snapshotPath}`);
        });
      });

      // always allow the PUT through
      console.log(`  [PUT] ${filePath}`);
      super._openWriteStream(webPath, ctx, callback);
    });
  }
}

// ---- start ----
const vaultPath = path.join(os.homedir(), 'Desktop', 'test-vault');
const port = 8080;

// Kill any existing process on port
try {
  const cp = require('child_process');
  const out = cp.execSync(`netstat -ano | findstr :${port} | findstr LISTENING`).toString().trim();
  const pid = out.split(/\s+/).pop();
  if (pid) process.kill(parseInt(pid));
} catch {}

const fs2 = new VersionedFileSystem(vaultPath);
const server = new WebDAVServer({ rootFileSystem: fs2, port, requireAuthentification: false });

// Network
function getIPs() {
  const ips = [];
  const ifs = os.networkInterfaces();
  for (const n of Object.keys(ifs)) {
    for (const i of ifs[n] || []) {
      if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
    }
  }
  return ips;
}

server.start(port, () => {
  const ips = getIPs();
  console.log('========================================');
  console.log('  WebDAV + Version Snapshot');
  console.log('========================================');
  console.log('  Vault:', vaultPath);
  console.log('  Port: ', port);
  console.log('');
  console.log('  Phone URL:');
  ips.forEach(ip => console.log('  http://' + ip + ':' + port));
  console.log('');
  console.log('  HOW IT WORKS:');
  console.log('  Every PUT snapshots the current local');
  console.log('  file to .sync-history/ before writing.');
  console.log('  Browse .sync-history/ to see all versions.');
  console.log('========================================');
  console.log('\n[Ready] Waiting for requests...\n');
  console.log('Press Ctrl+C to stop\n');
});

process.on('SIGINT', () => { server.stop(() => process.exit(0)); });
