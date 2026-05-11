<template>
  <div class="side-bar flex h-full flex-col items-center gap-1 border-r border-white/[0.04] bg-[#0d0d0d] p-1 pt-12">
    <div
      v-for="(item, index) in sidebarItems"
      :key="index"
      class="side-bar-item group flex h-10 w-full cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[#1a1a1a]"
      @click="item.clickHandler"
    >
      <component
        :is="item.icon"
        class="size-5 stroke-[1.5px] text-[#666] transition-colors group-hover:text-white"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTabStore } from '../../store/tabStore';

import { Radio, History, Terminal, FolderOpen } from 'lucide-vue-next';
import SyncPanel from '../syncPanel/index.vue';
import SnapshotBrowser from '../snapshotBrowser/index.vue';
import VaultSwitcher from '../vaultSwitcher/index.vue';

const { createTab } = useTabStore();

const sidebarItems = [
  {
    icon: FolderOpen,
    clickHandler: () => createTab('Extension', { component: VaultSwitcher, name: 'Vaults' }),
  },
  {
    icon: Radio,
    clickHandler: () => createTab('Extension', { component: SyncPanel, name: 'Sync' }),
  },
  {
    icon: History,
    clickHandler: () => createTab('Extension', { component: SnapshotBrowser, name: 'History' }),
  },
  {
    icon: Terminal,
    clickHandler: () => createTab('Terminal', { name: 'Terminal' }),
  },
];

onMounted(() => {
  console.log('side bar mounted');
});
</script>
