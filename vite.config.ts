import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      // reactCompilerPreset 은 compilationMode·target 만 받는다. 이전엔 filter 를 넘겼는데
      // babel-plugin-react-compiler 의 parsePluginOptions 가 defaultOptions 에 없는 키를
      // 조용히 버려(isCompilerFlag) 실제로는 적용된 적이 없는 dead option 이었다.
      // 동작 변경 없이 타입 오류만 제거하기 위해 제거한다.
      // (컴파일 대상을 실제로 좁히려면 react-compiler 의 sources 옵션을 쓰면 된다 — 별도 결정 필요)
      presets: [reactCompilerPreset()],
    }),
    svgr(),
    tailwindcss()
  ],
  server: {
    port: 3001,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 10000,
    target: 'es2020',
  }
})