// extension Editor extens from EditorPanel
import { EditorPanel } from '../../core/models/editor/EditorPanelAbstract';
import { App, createApp, Component } from 'vue';

export class ExtensionEditor extends EditorPanel {
  #container: HTMLElement | null = null;
  #vueapp: App | null = null;
  #component: Component;
  #initialProps: Record<string, any>;

  constructor(id: string, component: Component, props: Record<string, any> = {}) {
    super(id, 'extension');
    this.#component = component;
    this.#initialProps = props;
  }

  create(container: HTMLElement): void {
    // TODO ： bind a component to the container
    // create a editor instance
    // perpare init the components {{ data ？ }}
    this.#container = container;

    this.#vueapp = createApp(this.#component, {
      ...this.#initialProps,
      sessionId: this.id,
    });

    this.#vueapp.mount(container);

    // 先隐藏
    this.#container.style.display = 'none';
  }

  mount(): void {
    // TODO ： bind
    this.#container.style.display = 'block';
  }

  unmount(): void {
    // dispaly none,remove listener
    this.#container.style.display = 'none';
  }

  dispose(): void {
    //remove all the listener， clean ram
    if (this.#vueapp) {
      this.#vueapp.unmount();
      this.#vueapp = null;
    }
  }
}
