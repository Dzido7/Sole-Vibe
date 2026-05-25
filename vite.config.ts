import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Automatically sync the images to public folder so they are bundled into the production "dist" directory correctly
const sourceDir = path.resolve(__dirname, 'src/assets/images');
const targetDir = path.resolve(__dirname, 'public/src/assets/images');

try {
  if (fs.existsSync(sourceDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const srcFile = path.join(sourceDir, file);
      const destFile = path.join(targetDir, file);
      // Only copy if size differs or dest doesn't exist to optimize speed
      if (!fs.existsSync(destFile) || fs.statSync(srcFile).size !== fs.statSync(destFile).size) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
    console.log('[Assets Sync] Successfully synchronized image assets to public directory.');
  }
} catch (error) {
  console.error('[Assets Sync] Failed to copy image assets:', error);
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
