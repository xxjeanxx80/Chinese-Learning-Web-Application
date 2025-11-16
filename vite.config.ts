import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Tách vocabulary data thành chunk riêng
          if (id.includes('vocabulary.ts') && !id.includes('vocabularyStorage')) {
            return 'vocabulary-data';
          }
          // Tách vocabularyStorage thành chunk riêng
          if (id.includes('vocabularyStorage')) {
            return 'vocabulary-storage';
          }
          // Tách các utils lớn thành chunk riêng
          if (id.includes('utils/')) {
            return 'utils';
          }
          // Tách vendor libraries
          if (id.includes('node_modules')) {
            // Tách React và React DOM
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Tách các thư viện khác
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            return 'vendor';
          }
        },
      },
    },
    // Tăng giới hạn cảnh báo chunk size (vì vocabulary data rất lớn)
    chunkSizeWarningLimit: 600,
  },
})
