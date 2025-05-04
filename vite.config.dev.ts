import { defineConfig } from 'vite';

export default defineConfig({
    assetsInclude: ['**/*.vert', '**/*.frag'],
    // root: '/',
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
    server: {
        watch: {
            usePolling: true,
        },
    },
    // optimizeDeps: {
    //     include: ['shaders.ts'],
    // },
});