<template>
  <div
    class="side-bar flex h-full flex-col items-center gap-1 border-t border-white/20 p-1! pt-12!"
  >
    <div
      v-for="(item, index) in sidebarItems"
      :key="index"
      class="side-bar-item group flex h-10 w-full cursor-pointer items-center justify-center rounded-lg hover:bg-white/40"
      @click="item.clickHandler"
    >
      <component
        :is="item.icon"
        class="text-text-brand size-6 stroke-[1.5px] opacity-60 group-hover:opacity-100"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTabStore } from '../../store/tabStore';

import { Gauge, Terminal, Upload } from 'lucide-vue-next';

const { createTab } = useTabStore();

const sidebarItems = [
  {
    icon: Gauge,
    clickHandler: () => console.log('Dashboard clicked'),
  },
  {
    icon: Upload,
    clickHandler: () => console.log('Sync status clicked'),
  },
  {
    icon: Terminal,
    clickHandler: () => createTab('Terminal'),
  },
];

onMounted(() => {
  console.log('side bar mounted');
});
</script>
