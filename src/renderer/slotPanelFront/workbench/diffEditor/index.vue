<template>
  <div class="flex min-h-0 flex-1 flex-col bg-[#0d0d0d]">
    <!-- Toolbar -->
    <div class="flex items-center justify-between border-b border-white/[0.04] px-4 py-2">
      <span class="font-mono text-xs text-[#999]">{{ snapshotName }}</span>
      <div class="flex items-center gap-3">
        <span class="text-[10px] text-[#666]">← snapshot / current →</span>
        <button
          class="rounded-md bg-[#5e6ad2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#6c77e0]"
          @click="restore"
        >
          Restore This Version
        </button>
      </div>
    </div>

    <!-- Monaco diff -->
    <div ref="diffContainer" class="flex-1 min-h-0" />

    <div v-if="restored" class="border-t border-[#1d3d1d] bg-[#0f1f0f] px-4 py-2 text-xs text-[#30a46c]">
      Restored! File has been overwritten with this snapshot.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

const props = defineProps<{
  snapshotPath: string;
  currentPath: string;
}>();

const diffContainer = ref<HTMLElement | null>(null);
const snapshotName = ref('');
const restored = ref(false);

let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null;

async function loadAndRender() {
  if (!diffContainer.value) return;

  snapshotName.value = props.snapshotPath.split(/[/\\]/).pop() || '';

  const [snapRes, currRes] = await Promise.all([
    window.electronAPI!.invoke('sync:readFile', props.snapshotPath),
    window.electronAPI!.invoke('sync:readFile', props.currentPath),
  ]);

  const original = monaco.editor.createModel(
    snapRes.ok ? snapRes.content : '// failed to load',
    'markdown'
  );
  const modified = monaco.editor.createModel(
    currRes.ok ? currRes.content : '// failed to load',
    'markdown'
  );

  if (diffEditor) diffEditor.dispose();

  diffEditor = monaco.editor.createDiffEditor(diffContainer.value, {
    theme: 'vs-dark',
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: false },
  });

  diffEditor.setModel({ original, modified });
}

async function restore() {
  const res = await window.electronAPI!.invoke('sync:restoreSnapshot', props.snapshotPath, props.currentPath);
  if (res.ok) {
    restored.value = true;
  }
}

onMounted(loadAndRender);
watch(() => [props.snapshotPath, props.currentPath], loadAndRender);
onBeforeUnmount(() => {
  diffEditor?.dispose();
});
</script>
