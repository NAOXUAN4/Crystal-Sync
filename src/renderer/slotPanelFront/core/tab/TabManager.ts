// core/tab/TabManager.ts

export class TabManager {
  // 只存 ID，不存实例，轻量化
  #tabHistory: string[] = [];

  /**
   * 记录激活历史
   * 当用户点击某个 Tab 时调用
   */
  trackActiveId(id: string) {
    // 移除旧的记录，把最新的 id 放到最后 (MRU: Most Recently Used)
    this.#tabHistory = this.#tabHistory.filter(hId => hId !== id);
    this.#tabHistory.push(id);
  }

  /**
   * 计算关闭某个 ID 后，下一个该激活谁
   * @param closingId 正在被关闭的 ID
   * @param allCurrentIds 当前还存在的所有的 ID (从 Store 传进来)
   */
  getNextActiveIdAfterClose(closingId: string): string | null {
    // 1. 从历史中移除当前 ID
    this.#tabHistory = this.#tabHistory.filter(id => id !== closingId);

    // 2. 如果历史栈里还有东西，取最后一个（最近访问的）
    if (this.#tabHistory.length > 0) {
      return this.#tabHistory[this.#tabHistory.length - 1];
    }

    // 3. 如果历史栈空了（极端情况），或者历史栈里的 ID 都不在 allCurrentIds 里了
    // 这里可以做个兜底，返回 null 或者让 Store 自己决定
    return null;
  }

  /**
   * 如果 Store 清空了，这里也清空
   */
  clear() {
    this.#tabHistory = [];
  }
}
