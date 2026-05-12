<template>
  <div class="flex h-full flex-col items-center justify-center gap-6 bg-[#141414] p-8">
    <!-- Status -->
    <div class="flex items-center gap-3">
      <div
        :class="status.running ? 'bg-[#30a46c]' : 'bg-[#555]'"
        class="h-2.5 w-2.5 rounded-full transition-colors duration-300"
      />
      <span class="text-lg font-medium text-white">
        {{ status.running ? 'Server Running' : 'Server Stopped' }}
      </span>
    </div>

    <!-- Connection info -->
    <div v-if="status.running" class="w-full max-w-sm space-y-3 rounded-lg border border-white/[0.04] bg-[#0d0d0d] p-5">
      <div class="text-[10px] font-medium uppercase tracking-[0.15em] text-[#666]">Connection</div>

      <!-- LAN -->
      <div v-if="status.ips.lan.length">
        <div class="mb-1 text-[10px] text-[#888]">LAN</div>
        <div v-for="ip in status.ips.lan" :key="ip.address" class="font-mono text-sm text-[#ccc]">
          http://{{ ip.address }}:{{ status.port }}
          <span class="text-[11px] text-[#555] ml-1.5 font-sans">{{ ip.ifName }}</span>
        </div>
      </div>

      <!-- Tailscale -->
      <div v-if="status.ips.tailscale.length">
        <div class="mb-1 mt-2 text-[10px] text-[#888]">Tailscale</div>
        <div v-for="ip in status.ips.tailscale" :key="ip.address" class="font-mono text-sm text-[#ccc]">
          http://{{ ip.address }}:{{ status.port }}
          <span class="text-[11px] text-[#555] ml-1.5 font-sans">{{ ip.ifName }}</span>
        </div>
      </div>

      <!-- Other -->
      <div v-if="status.ips.other.length">
        <div class="mb-1 mt-2 text-[10px] text-[#888]">Other</div>
        <div v-for="ip in status.ips.other" :key="ip.address" class="font-mono text-sm text-[#555]">
          http://{{ ip.address }}:{{ status.port }}
          <span class="text-[11px] text-[#555] ml-1.5 font-sans">{{ ip.ifName }}</span>
        </div>
      </div>

      <div class="mt-2 font-mono text-[11px] text-[#666]">{{ status.vaultPath }}</div>
    </div>

    <div v-if="status.error" class="text-sm text-[#e5484d]">{{ status.error }}</div>

    <!-- Start/Stop -->
    <button
      :class="status.running
        ? 'border border-[#3d1f1f] bg-[#2a1515] text-[#e5484d] hover:bg-[#3d1f1f]'
        : 'bg-[#5e6ad2] text-white hover:bg-[#6c77e0]'"
      class="rounded-md px-6 py-2 text-sm font-medium transition-colors"
      @click="toggleServer"
    >
      {{ status.running ? 'Stop Server' : 'Start Server' }}
    </button>

    <div v-if="error" class="text-sm text-[#e5484d]">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';

interface IPEntry {
  address: string;
  ifName: string;
}

interface CategorizedIPs {
  lan: IPEntry[];
  tailscale: IPEntry[];
  other: IPEntry[];
}

interface WebDAVStatus {
  running: boolean;
  port: number;
  vaultPath: string;
  ips: CategorizedIPs;
  error?: string;
}

const status = reactive<WebDAVStatus>({
  running: false,
  port: 0,
  vaultPath: '',
  ips: { lan: [], tailscale: [], other: [] },
});

const error = ref('');

let cleanupStatus: (() => void) | null = null;

async function getActiveVaultPath(): Promise<string> {
  const res = await window.electronAPI!.invoke('vault:list');
  if (res.ok && res.activeId) {
    const active = res.presets.find((p: any) => p.id === res.activeId);
    if (active) return active.path;
  }
  return '';
}

async function toggleServer() {
  error.value = '';
  if (status.running) {
    const res = await window.electronAPI!.invoke('webdav:stop');
    Object.assign(status, res.status);
  } else {
    const vaultPath = await getActiveVaultPath();
    if (!vaultPath) {
      error.value = 'No vault selected. Add a vault in Vaults panel first.';
      return;
    }
    const res = await window.electronAPI!.invoke('webdav:start', vaultPath);
    if (res.ok) {
      Object.assign(status, res.status);
    } else {
      error.value = 'Failed to start server';
    }
  }
}

onMounted(async () => {
  const res = await window.electronAPI!.invoke('webdav:status');
  if (res.ok) Object.assign(status, res.status);

  cleanupStatus = window.electronAPI!.on('webdav:statusChanged', (newStatus: WebDAVStatus) => {
    Object.assign(status, newStatus);
  });
});

onBeforeUnmount(() => {
  cleanupStatus?.();
});
</script>
