<template>
  <div class="workbench-container">
    <div class="side-bar-container">
      <side-bar />
    </div>
    <div class="tab-container">
      <tabs />
    </div>
    <div class="editor-container">
      <editors />
    </div>
  </div>
</template>

<script setup lang="ts">
import SideBar from './sideBar/index.vue';
import Editors from './editors/index.vue';
import tabs from './tabs/index.vue';

import { tabManagerInstance } from '../store/sessionStore';
import { EditorSession } from '../core/editor/EditorSession';
import { nextTick, onMounted, ref, markRaw } from 'vue';

onMounted(async () => {
  console.log('workbench mounted');
});
</script>

<style scoped>
.workbench-container {
  display: grid;
  grid-template:
    'sidebar tabs' 50px
    'sidebar editor' 1fr;
  height: 100vh;
  grid-template-columns: 45px 1fr;
  transition: grid-template-columns 0.3s;
}

.side-bar-container {
  grid-area: sidebar;
  overflow: hidden;
}

.tab-container {
  grid-area: tabs;
  overflow: hidden;
}

.editor-container {
  grid-area: editor;
  overflow: auto;
  position: relative;
}
</style>
