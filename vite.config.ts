import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        minify: false,
        // minify: 'terser',
        // terserOptions: {
        //     compress: {
        //         drop_console: true,
        //         passes: 1000,
        //     },
        // },
        // sourcemap: true, // Debug
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
        target: 'es2019'
    },
    // optimizeDeps: {
    //     include: ['shaders.ts'],
    // },
});
