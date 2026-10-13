import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    // GitHub Pages 프로젝트 사이트(`/chatbot-db/`)와 다른 정적 호스팅을 모두 지원합니다.
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      babel({
        presets: [reactCompilerPreset()],
      }),
    ],
  }
})
