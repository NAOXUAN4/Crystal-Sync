import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { EditorPanel } from '../../core/models/editor/EditorPanelAbstract';

// 1. 定义 ANSI 颜色代码常量，方便拼接
const C = {
  RESET: '\x1b[0m',
  BLUE: '\x1b[1;34m', // 亮蓝 (
  GREEN: '\x1b[1;32m', // 亮绿
  CYAN: '\x1b[36m', // 青色
  RED: '\x1b[31m', // 红色
  GRAY: '\x1b[90m', // 灰色
};
const PROMPTSTART = `\r${C.CYAN}$ ${C.RESET}`;
const PROMPT = `\r\n${C.CYAN}$ ${C.RESET}`;

export class TerminalEditor extends EditorPanel {
  #termInstance: Terminal | null = null;
  #container: HTMLElement | null = null;

  #inputBuffer: string | null = null;
  #removeListeners: Set<() => void> = new Set();
  #fitAddon: FitAddon | null = null;

  constructor(id: string) {
    super(id, 'terminal');
  }

  create(container: HTMLElement): void {
    if (!container) return;

    container.style.padding = '10px';
    container.style.boxSizing = 'border-box';
    container.style.overflow = 'hidden';

    this.#termInstance = new Terminal({
      rows: 24,
      cols: 80,
      cursorBlink: true,
      fontFamily: 'Consolas, Monaco, "Courier New", "Microsoft YaHei", monospace',
      allowTransparency: true, // 允许透明
      scrollback: 1000,
      convertEol: true,

      theme: {
        background: '#00000000', // 完全透明，透出背景的磨砂
        foreground: '#334155', // 默认文字颜色 (Slate-700)，深灰适配浅色玻璃
        cursor: '#002FA7', // 克莱因蓝光标
        cursorAccent: '#ffffff',
        selectionBackground: 'rgba(0, 47, 167, 0.2)',

        // ANSI 颜色定义 (终端收到 \x1b[34m 时显示的颜色)
        black: '#000000',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#002FA7', // 克莱因蓝
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#64748b',

        // 亮色系
        brightBlack: '#94a3b8',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#3b82f6',
        brightMagenta: '#d8b4fe',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
    });

    this.#container = container;
    this.#inputBuffer = '';

    this.#fitAddon = new FitAddon();
    this.#termInstance.loadAddon(this.#fitAddon);

    this.#termInstance.open(this.#container);
    this.#fitAddon.fit();

    this.#termInstance.write(PROMPTSTART);

    this.isMounted = true;
    this.#container.style.display = 'none';
  }

  /** -------------------------
   * shell 通信
   ----------------------------*/
  async shellInvoke(command: string) {
    try {
      const result = await (window as any).electronAPI.invoke('shell:exec', command);
    } catch (e: any) {
      console.warn('shell:exec err', e);
      // 如果调用本身出错，用红色打印错误
      this.#termInstance?.write(`\r\n${C.RED}Error: ${e.message || e}${C.RESET}`);
      this.#termInstance?.write(PROMPT);
    }
  }

  shellOnListener() {
    const api = (window as any).electronAPI;
    if (api?.on) {
      this.#removeListeners.add(
        api.on('shell:stdout', (data: any) => {
          // stdout 通常保持原样，如果命令本身(如 ls --color)带颜色，xterm 会自动解析
          this.#termInstance?.write(data);
        })
      );

      this.#removeListeners.add(
        api.on('shell:stderr', (data: any) => {
          // 4. 强制把 stderr 染成红色
          // 注意：这可能会覆盖掉 stderr 里原本的颜色格式，但能确保错误显眼
          this.#termInstance?.write(`${C.RED}${data}${C.RESET}`);
        })
      );

      this.#removeListeners.add(
        api.on('shell:close', (data: any) => {
          console.log('shell:close:', data);
          this.cleanInputerBuffer();
          this.#termInstance?.write(PROMPT);
        })
      );
    }
  }

  /** ------------------------
   * 终端事件绑定
   ---------------------------*/
  private bindTerminalEvents() {
    if (!this.#termInstance) return;

    const disposable_ondata = this.#termInstance.onData(data => {
      // 5. 处理 Ctrl+C
      if (data === '\x03') {
        this.cleanInputerBuffer();
        // 打印 ^C 并换行
        this.#termInstance?.write('^C');
        this.#termInstance?.write(PROMPT);
        try {
          (window as any).electronAPI.invoke('shell:interrupt');
        } catch (e) {
          console.warn('Failed to send interrupt signal', e);
        }
        return;
      }

      if (data === '\b' || data === '\x7f') return;
      if (data === '\r' || data === '\n' || data === '\r\n') return;

      // 6. 输入回显 (Echo)
      // 如果你想让用户输入的命令也是有颜色的(比如绿色)，可以这样写：
      // this.#termInstance?.write(C.GREEN + data + C.RESET);
      // 但通常保持默认色即可：
      this.#inputBuffer += data;
      this.#termInstance?.write(data);
    });

    this.#removeListeners.add(() => disposable_ondata.dispose());

    const disposable_onkey = this.#termInstance.onKey(({ key, domEvent }) => {
      if (domEvent.key === 'Enter') {
        this.#termInstance?.write('\r\n');
        const cmd = this.#inputBuffer?.trim() || '';
        this.cleanInputerBuffer();

        if (cmd.length > 0) {
          this.shellInvoke(cmd);
          // 注意：这里不要立即打印 PROMPT，
          // 因为 shellInvoke 是异步的，应该在 shell:close 或 shell:stdout 结束时打印
          // 如果后端不是流式返回而是直接返回，你可能需要在这里手动打印 PROMPT
        } else {
          this.#termInstance?.write(PROMPT);
        }
        domEvent.preventDefault();
      } else if (domEvent.key === 'Backspace') {
        // 简单的退格处理
        if (this.#inputBuffer && this.#inputBuffer.length > 0) {
          this.#inputBuffer = this.#inputBuffer.slice(0, -1);
          // \b 退格, 空格覆盖, \b 再退格
          this.#termInstance?.write('\b \b');
        }
        domEvent.preventDefault();
      }
    });
    this.#removeListeners.add(() => disposable_onkey.dispose());

    /// 阻止光标移动
    this.#termInstance.attachCustomKeyEventHandler(e => {
      if (
        e.key == 'ArrowUp' ||
        e.key == 'ArrowDown' ||
        e.key == 'ArrowLeft' ||
        e.key == 'ArrowRight'
      ) {
        return false;
      }
      return true;
    });
  }

  cleanInputerBuffer(): void {
    this.#inputBuffer = '';
  }

  fit(): void {
    this.#fitAddon?.fit();
  }

  mount(): void {
    if (!this.#container || !this.#termInstance) return;
    this.shellOnListener();
    this.bindTerminalEvents();
    this.#container.style.display = 'block';
  }

  unmount(): void {
    if (this.#container) this.#container.style.display = 'none';
    this.cleanInputerBuffer();
    this.#removeListeners.forEach(removeFunc => removeFunc());
    this.#removeListeners.clear();
  }

  dispose(): void {
    this.#termInstance?.dispose();
    this.#termInstance = null;
  }
}
