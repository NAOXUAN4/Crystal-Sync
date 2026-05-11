export abstract class EditorPanel {
  id: string;
  type: string;
  name: string;
  isMounted = false;
  constructor(id: string, type: string, name?: string) {
    this.id = id;
    this.type = type;
    this.name = name || type;
  }

  //创建
  abstract create(container: HTMLElement): void;

  //挂载
  abstract mount(): void;

  //解绑
  abstract unmount(): void;

  //销毁
  abstract dispose(): void;
}
