import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        minify: false, // Debug
        sourcemap: true, // Debug
        lib: {
            entry: 'src/engine.ts',
            formats: ['iife'],
            name: 'engine',
            fileName: 'planetEngine',
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
    },
});