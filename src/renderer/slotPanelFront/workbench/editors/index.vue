<template>
  <div class="h-full w-full bg-white/40">
    <!-- <TerminalEditor /> -->
    <div
      v-for="(_, index) in editorlist"
      :key="index"
      :ref="el => setRef(el, index)"
      class="terminal-editor"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch, type Ref } from 'vue';

import { EditorSession } from '../../core/editor/EditorSession';
import { ExtensionEditor } from '../../editors/ExtensionEditor/ExtensionEditor';

import { useSessionStore } from '../../store/sessionStore';

// import TerminalEditor from '../../editors/terminalEditor/test.vue'

const sessionStore = useSessionStore();
const editorSessions = sessionStore.editorSessions;
const activeSessionId = sessionStore.activeSessionId;

const editorRefs = ref<HTMLElement[]>([]);
const editorlist: Ref<EditorSession[]> = ref([]);

const setRef = (el: HTMLElement | null, index: number) => {
  if (el) {
    editorRefs.value[index] = el;
  } else {
    editorRefs.value[index] = null;
  }
};

watch(
  () => editorSessions,
  async newVal => {
    // console.log('editorSessions changed:', newVal);
    editorlist.value = [...newVal];
  },
  { deep: true }
);

let termBuffer: EditorSession | null = null;

watch(
  () => sessionStore.activeSessionId,
  newVal => {
    // console.log('activeSessionId changed:', newVal);

    nextTick(() => {
      if (termBuffer != null) {
        termBuffer.unmount();
      }
      const activeIndex = editorlist.value.findIndex(session => session.id === newVal);

      if (activeIndex !== -1 && editorRefs.value[activeIndex]) {
        editorlist.value[activeIndex].mount(editorRefs.value[activeIndex]);
        termBuffer = editorlist.value[activeIndex];
      } else {
        console.log('Failed to mount terminal: either activeIndex is invalid or termRef not ready');
      }
    });
  },
  { deep: true }
);

// const clickhandler = (activeTerm: number) => {
//   if (termBuffer != null) {
//     termBuffer.unmount();
//   }
//   editorlist.value[activeTerm].mount(editorRefs.value[activeTerm]);
//   termBuffer = editorlist.value[activeTerm];
// };

onMounted(async () => {});
</script>

<style scoped></style>
