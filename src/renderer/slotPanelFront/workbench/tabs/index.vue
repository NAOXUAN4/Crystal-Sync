<template>
  <div
    ref="tabsScroller"
    class="scrollbar-hide flex h-full min-w-0 gap-0 overflow-x-auto border-b border-white/[0.04] bg-[#0d0d0d]"
    @wheel="onWheel"
  >
    <div
      v-for="(tabListItem, index) in tabList"
      :key="tabListItem.id"
      @click="activeTab(tabListItem.id)"
      :id="tabListItem.id"
      class="relative flex h-full shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-t-md px-4 transition-all duration-150 select-none"
      :class="
        currentActiveTab === tabListItem.id
          ? 'w-44 bg-[#141414] text-white'
          : 'w-36 text-[#666] hover:text-[#999]'
      "
    >
      <Terminal v-if="tabListItem.type === 'Terminal'" :size="16" />
      <Blocks v-if="tabListItem.type === 'Extension'" :size="16" />
      <span class="truncate pl-2 text-xs">{{ tabListItem.name }}</span>
      <X
        :size="14"
        class="absolute right-2 text-[#555] transition-colors hover:text-[#e5484d]"
        @click.stop="closeTab(tabListItem.id)"
      />
    </div>

    <div
      @click="createTab('Terminal')"
      class="add-sign group flex h-full w-10 shrink-0 cursor-pointer items-center justify-center rounded-t-md text-[#555] transition-colors hover:bg-[#141414] hover:text-white"
    >
      <Plus :size="16" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Terminal, Plus, X, Blocks } from 'lucide-vue-next';
import { useTabStore } from '../../store/tabStore';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const tabStore = useTabStore();
const { currentActiveTab, tabList } = storeToRefs(tabStore);
const { createTab, activeTab, closeTab } = tabStore;

const tabsScroller = ref<HTMLElement | null>(null);

function onWheel(event: WheelEvent) {
  const el = tabsScroller.value;
  if (!el) return;
  if (el.scrollWidth <= el.clientWidth) return;

  event.preventDefault();
  el.scrollLeft += event.deltaY;
}
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
