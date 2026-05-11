<script setup lang="ts">
import { X, Minus, Square, Copy } from 'lucide-vue-next';
import Workbench from './workbench/index.vue';
import { windowCommandType } from './types/window-types';
import { ref } from 'vue';

const windowIsMaximize = ref<boolean>(false);

const windowBtnHandler = async (state: windowCommandType) => {
  switch (state) {
    case 'maximize':
      const tmp = await (window as any).electronAPI.invoke('sys:maximizeWindow');
      windowIsMaximize.value = tmp.status === 'maximize' ? true : false;
      break;
    case 'minimize':
      await (window as any).electronAPI.invoke('sys:minimizeWindow');
      break;
    case 'close':
      await (window as any).electronAPI.invoke('sys:closeWindow');
      break;
    default:
      break;
  }
};
</script>

<template>
  <div class="app-shell relative flex h-screen w-full flex-col overflow-hidden bg-[#0d0d0d] font-sans">
    <div class="title-bar drag-region flex h-10 w-full items-center justify-between px-4 select-none">
      <div class="title-bar-title flex flex-1 justify-end"></div>
      <div class="title-bar-btn no-drag flex w-35 justify-end gap-5 pt-0.5 text-[#666]">
        <Minus :size="18" class="hover:text-white transition-colors cursor-pointer" @click="windowBtnHandler('minimize')" />
        <Square v-if="!windowIsMaximize" :size="16" class="hover:text-white transition-colors cursor-pointer" @click="windowBtnHandler('maximize')" />
        <Copy v-if="windowIsMaximize" :size="16" class="hover:text-white transition-colors cursor-pointer" @click="windowBtnHandler('maximize')" />
        <X :size="18" class="hover:text-[#e5484d] transition-colors cursor-pointer" @click="windowBtnHandler('close')" />
      </div>
    </div>
    <div class="body-bar relative flex-1 overflow-hidden">
      <workbench />
    </div>
    <div class="footer-bar drag-region flex h-6 w-full items-center justify-between border-t border-white/[0.04] px-4 py-3 select-none" />
  </div>
</template>

<style>
.drag-region {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}
</style>
