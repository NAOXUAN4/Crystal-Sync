// store/useTabStore.ts
import { defineStore, storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useSessionStore } from './sessionStore';

export const useTabStore = defineStore('tab', () => {
  const sessionStore = useSessionStore();
  const { activeSessionId, editorSessions } = storeToRefs(sessionStore);

  // 直接透传 SessionStore 的 activeId
  const currentActiveTab = activeSessionId;

  const tabList = computed(() =>
    editorSessions.value.map(session => ({
      id: session.id,
      type: session.type,
      name: session.name || session.type,
    }))
  );

  const createTab = (type: any, args?: any) => sessionStore.createSession(type, args);
  const activeTab = (id: string) => sessionStore.activateSession(id);
  const closeTab = (id: string) => sessionStore.closeSession(id);

  return {
    currentActiveTab,
    tabList,
    createTab,
    activeTab,
    closeTab,
  };
});
