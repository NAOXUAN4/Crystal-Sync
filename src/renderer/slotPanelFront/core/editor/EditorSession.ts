import { ExtensionEditor } from '../../editors/ExtensionEditor/ExtensionEditor';
import { TerminalEditor } from '../../editors/terminalEditor/TerminalEditor';
import { EditorPanel } from '../models/editor/EditorPanelAbstract';
import type { EditorSessionType } from '../models/editor/EditorTypes';

// 用于包裹所有的editor实例的通用container
export class EditorSession {
  #id: string;
  #type: EditorSessionType;
  #container: HTMLElement | null = null;
  #editorInstance: EditorPanel | null = null;

  constructor(type: EditorSessionType, args?: Record<string, any>) {
    this.#type = type;
    this.#id = crypto.randomUUID();
    const name = args?.name as string | undefined;

    if (type == 'Terminal') {
      this.#editorInstance = new TerminalEditor(this.#id, name);
    } else if (type == 'WebView') {
      console.log('WebViewInstance');
    } else if (type == 'Extension') {
      if (args?.component) {
        this.#editorInstance = new ExtensionEditor(this.#id, args.component, args.props || {}, name);
        console.log('ExtensionInstance created:', this.#id);
      } else {
        console.error('Extension args missing component:', args);
      }
    }
  }

  get name() {
    return this.#editorInstance?.name || this.#type;
  }

  get id() {
    return this.#id;
  }

  get container() {
    return this.#container;
  }

  get type() {
    return this.#type;
  }

  mount(container: HTMLElement) {
    if (container && this.#editorInstance) {
      if (this.#container !== container) {
        this.#container = container;
        this.#editorInstance.create(container);
      }
      this.#editorInstance.mount();
    }
  }

  unmount() {
    if (this.#editorInstance) {
      this.#editorInstance.unmount();
    }
  }

  dispose() {
    if (this.#editorInstance) {
      this.#editorInstance.dispose();
    }
  }
}
