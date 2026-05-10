import { WebDAVServer, PhysicalFileSystem } from 'webdav-server/lib/index.v2';
import { networkInterfaces } from 'os';

export interface WebDAVStatus {
  running: boolean;
  port: number;
  vaultPath: string;
  localIPs: string[];
}

let server: WebDAVServer | null = null;
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

export async function startServer(vaultPath: string, port: number = 8080): Promise<WebDAVStatus> {
  if (server) {
    await stopServer();
  }

  const fileSystem = new PhysicalFileSystem(vaultPath);
  server = new WebDAVServer({
    rootFileSystem: fileSystem,
    port,
    requireAuthentification: false,
    serverName: 'Obsidian LAN Sync Bridge',
  });

  return new Promise((resolve, reject) => {
    server!.start(port, () => {
      currentPort = port;
      currentVaultPath = vaultPath;
      console.log(`WebDAV server started on port ${port}, serving ${vaultPath}`);
      resolve(getStatus());
    });
    // Fallback timeout in case start callback never fires
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
      currentVaultPath = '';
      console.log('WebDAV server stopped');
      resolve();
    });
    // Fallback
    setTimeout(() => {
      server = null;
      currentVaultPath = '';
      resolve();
    }, 1000);
  });
}
