import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: 'src',
    resolve: {
        alias: { '@engine': path.resolve(__dirname, 'engine') }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true
    }
});
