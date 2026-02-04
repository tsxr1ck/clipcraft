import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Fallback key if not provided in env
  const fallbackKey = 'sk-5b8878ae69dd46fc971f42647f1de937';
  const qwenKey = env.VITE_QWEN_API_KEY || fallbackKey;
  const dashscopeKey = env.VITE_DASHSCOPE_API_KEY || qwenKey;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // Image generation API (DashScope AIGC pattern)
        '/api/qwen/services/ai': {
          target: 'https://dashscope-intl.aliyuncs.com/api/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (qwenKey) {
                proxyReq.setHeader('Authorization', `Bearer ${qwenKey}`)
              }
            })
          },
        },
        // Task status polling API (DashScope native)
        '/api/qwen/tasks': {
          target: 'https://dashscope-intl.aliyuncs.com/api/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (qwenKey) {
                proxyReq.setHeader('Authorization', `Bearer ${qwenKey}`)
              }
            })
          },
        },
        // Audio/TTS API - AIGC pattern for audio generation
        '/api/qwen/services/aigc': {
          target: 'https://dashscope-intl.aliyuncs.com/api/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (qwenKey) {
                proxyReq.setHeader('Authorization', `Bearer ${qwenKey}`)
              }
              console.log('Audio API Request:', req.method, req.url);
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('Audio API Response:', proxyRes.statusCode, req.url);
            })
          },
        },
        // Chat completions API (OpenAI-compatible mode)
        '/api/qwen/chat': {
          target: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (qwenKey) {
                proxyReq.setHeader('Authorization', `Bearer ${qwenKey}`)
              }
            })
          },
        },
        // Wan2.6 Video Generation
        '/api/wan': {
          target: 'https://dashscope-intl.aliyuncs.com/api/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/wan/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Wan services might need the Dashscope key specifically, or falls back to Qwen
              if (dashscopeKey) {
                proxyReq.setHeader('Authorization', `Bearer ${dashscopeKey}`)
              }
              proxyReq.setHeader('X-DashScope-Async', 'enable')
            })
          },
        },
      },
    },
  }
})