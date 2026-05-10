<template>
  <div
    ref="tabsScroller"
    class="scrollbar-hide flex h-full min-w-0 gap-0.5 overflow-x-auto border-t border-b border-white/20 pt-2!"
    @wheel="onWheel"
  >
    <div
      v-for="(tabListItem, index) in tabList"
      :key="tabListItem.id"
      @click="activeTab(tabListItem.id)"
      :id="tabListItem.id"
      class="relative flex h-full w-30 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-t-xl pt-1.5! pl-4! transition-all duration-200 select-none"
      :class="
        currentActiveTab === tabListItem.id
          ? 'w-60 border-x border-white/20 bg-white/40 text-[#002FA7] shadow-sm'
          : 'text-text-muted w-40 border border-white/0 bg-white/0 opacity-50'
      "
    >
      <Terminal v-if="tabListItem.type === 'Terminal'" :size="20" class="transition-colors" />
      <Blocks v-if="tabListItem.type === 'Extension'" :size="20" class="transition-colors" />
      <span
        class="truncate pl-3!"
        :class="currentActiveTab === tabListItem.id ? 'pr-10!' : 'pr-10!'"
      >{{ tabListItem.type }}
      </span>
      <X
        :size="16"
        class="absolute right-2 opacity-50 transition-colors hover:text-red-500 hover:opacity-100"
        @click="closeTab(tabListItem.id)"
      />
    </div>

    <!-- + 按钮跟随在 tab 列表末尾 -->
    <div
      @click="createTab('Terminal')"
      class="add-sign group text-text-brand/40 flex h-full w-12 shrink-0 cursor-pointer items-center justify-center rounded-t-xl bg-transparent pt-1! hover:bg-white/40"
      :class="tabList.length <= 0 ? 'bg-white/40' : ''"
    >
      <Plus
        :size="16"
        class="group-hover:text-text-brand"
        :class="tabList.length <= 0 ? 'text-text-brand opacity-80' : ''"
      />
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
  // 不需要滚动的场合不拦截，让页面正常滚动
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
