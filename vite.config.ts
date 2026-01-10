import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
        'process.env.ODDS_API_KEY': JSON.stringify(env.ODDS_API_KEY),
        'process.env.FOOTBALL_DATA_KEY': JSON.stringify(env.FOOTBALL_DATA_KEY),
        'process.env.CLOUBET_API_KEY': JSON.stringify(env.CLOUBET_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
