import { defineConfig } from 'vite';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';

export default async () => {
  const { default: vue } = await import('@vitejs/plugin-vue');
  return defineConfig({
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: tag => tag.startsWith('fluent-'),
          },
        },
      }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    // 根据你的项目结构调整 root/outDir
    root: path.resolve(__dirname, 'src/renderer/slotPanelFront'),
    server: { port: 5173 },
    build: {
      outDir: path.resolve(__dirname, '.vite', 'renderer'),
      emptyOutDir: true,
    },
  });
};
