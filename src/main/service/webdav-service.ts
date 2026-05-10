import { WebDAVServer } from 'webdav-server/lib/index.v2';
import { networkInterfaces } from 'os';
import { ConflictFileSystem, ConflictEvent } from './conflict-file-system';
import { SyncRecordStore } from './sync-record-store';

export interface WebDAVStatus {
  running: boolean;
  port: number;
  vaultPath: string;
  localIPs: string[];
}

export type ConflictHandler = (event: ConflictEvent) => void;

let server: WebDAVServer | null = null;
let conflictFS: ConflictFileSystem | null = null;
let currentPort = 8080;
let currentVaultPath = '';

function getLocalIPs(): string[] {
  const ips: string[] = [];
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

export function getStatus(): WebDAVStatus {
  return {
    running: server !== null,
    port: currentPort,
    vaultPath: currentVaultPath,
    localIPs: getLocalIPs(),
  };
}

export async function startServer(
  vaultPath: string,
  port: number = 8080,
  onConflict?: ConflictHandler,
): Promise<WebDAVStatus> {
  if (server) {
    await stopServer();
  }

  const syncStore = new SyncRecordStore(vaultPath);
  conflictFS = new ConflictFileSystem(vaultPath, syncStore);

  if (onConflict) {
    conflictFS.setOnConflict(onConflict);
  }

  server = new WebDAVServer({
    rootFileSystem: conflictFS,
    port,
    requireAuthentification: false,
    serverName: 'Obsidian LAN Sync Bridge',
  });

  return new Promise((resolve) => {
    server!.start(port, () => {
      currentPort = port;
      currentVaultPath = vaultPath;
      console.log(`WebDAV server started on port ${port}, serving ${vaultPath}`);
      resolve(getStatus());
    });
    setTimeout(() => {
      if (server) {
        currentPort = port;
        currentVaultPath = vaultPath;
        resolve(getStatus());
      }
    }, 2000);
  });
}

export async function stopServer(): Promise<void> {
  if (!server) return;

  return new Promise((resolve) => {
    server!.stop(() => {
      server = null;
      conflictFS = null;
      currentVaultPath = '';
      console.log('WebDAV server stopped');
      resolve();
    });
    setTimeout(() => {
      server = null;
      conflictFS = null;
      currentVaultPath = '';
      resolve();
    }, 1000);
  });
}
