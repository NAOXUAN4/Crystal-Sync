<template>
  <div class="flex h-full flex-col bg-[#141414]">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
      <span class="text-[10px] font-medium uppercase tracking-[0.15em] text-[#666]">Vaults</span>
      <button
        class="rounded-md bg-[#5e6ad2] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#6c77e0]"
        @click="addVault"
      >
        Add Vault
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="presets.length === 0" class="flex flex-1 items-center justify-center text-sm text-[#555]">
      No vaults configured. Add one to start syncing.
    </div>

    <!-- Preset list -->
    <div v-else class="flex-1 overflow-y-auto">
      <div
        v-for="p in presets"
        :key="p.id"
        :class="activeId === p.id
          ? 'bg-[#1a1a1a] border-l-[3px] border-l-[#5e6ad2] pl-[9px]'
          : 'border-l-[3px] border-l-transparent pl-3 hover:bg-[#161616]'"
        class="flex cursor-pointer items-center justify-between py-2.5 pr-3 transition-colors group"
        @click="selectVault(p.id)"
      >
        <div class="min-w-0 flex-1">
          <div class="text-sm text-white truncate">{{ p.name }}</div>
          <div class="text-[11px] font-mono text-[#555] truncate mt-0.5">{{ p.path }}</div>
        </div>
        <button
          class="ml-2 shrink-0 rounded p-1 text-[#555] opacity-0 transition-all hover:bg-[#2a1515] hover:text-[#e5484d] group-hover:opacity-100"
          @click.stop="deleteVault(p.id)"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { X } from 'lucide-vue-next';

interface VaultPreset {
  id: string;
  name: string;
  path: string;
  createdAt: number;
}

const presets = ref<VaultPreset[]>([]);
const activeId = ref<string | null>(null);

async function loadVaults() {
  const res = await window.electronAPI!.invoke('vault:list');
  if (res.ok) {
    presets.value = res.presets;
    activeId.value = res.activeId;
  }
}

async function addVault() {
  const res = await window.electronAPI!.invoke('vault:selectFolder');
  if (!res.ok || !res.path) return;
  const name = res.path.split(/[\\/]/).pop() || res.path;
  await window.electronAPI!.invoke('vault:save', name, res.path);
  await loadVaults();
}

async function selectVault(id: string) {
  await window.electronAPI!.invoke('vault:setActive', id);
  await loadVaults();
}

async function deleteVault(id: string) {
  await window.electronAPI!.invoke('vault:delete', id);
  await loadVaults();
}

onMounted(() => {
  loadVaults();
});
</script>
