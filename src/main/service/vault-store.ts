import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface VaultPreset {
  id: string;
  name: string;
  path: string;
  createdAt: number;
}

interface VaultData {
  activeId: string | null;
  presets: VaultPreset[];
}

const STORE_DIR = path.join(os.homedir(), '.crystal-sync');
const STORE_PATH = path.join(STORE_DIR, 'vaults.json');

function ensureDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function read(): VaultData {
  ensureDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    }
  } catch {}
  return { activeId: null, presets: [] };
}

function write(data: VaultData): void {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function listVaults(): VaultData {
  return read();
}

export function saveVault(name: string, vaultPath: string): VaultPreset {
  const data = read();
  const preset: VaultPreset = {
    id: crypto.randomUUID(),
    name,
    path: vaultPath,
    createdAt: Date.now(),
  };
  data.presets.push(preset);
  if (!data.activeId) {
    data.activeId = preset.id;
  }
  write(data);
  return preset;
}

export function deleteVault(id: string): void {
  const data = read();
  data.presets = data.presets.filter(p => p.id !== id);
  if (data.activeId === id) {
    data.activeId = data.presets[0]?.id || null;
  }
  write(data);
}

export function setActiveVault(id: string): VaultPreset | null {
  const data = read();
  const preset = data.presets.find(p => p.id === id);
  if (preset) {
    data.activeId = id;
    write(data);
  }
  return preset || null;
}

export function getActiveVault(): VaultPreset | null {
  const data = read();
  return data.presets.find(p => p.id === data.activeId) || null;
}
