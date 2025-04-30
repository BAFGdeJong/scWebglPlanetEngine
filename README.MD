Add ingame textures to ./dist/textures/ for local testing.

Packages:  
    `npm install typescript --save-dev`  
    `npm install terser -g`  
    `npm install vite --save-dev`  
  
^ Use npm install for quick installation.  
  
Scripts:  
    `npm run build`  
    `npm run dev`  
  
^ Use dev for dev environment, build for final dist.  
  
Important to disable when not debugging,  
minify: false, Inside vite.config.ts < Set to true  
sourcemap: true, Inside vite.config.ts  < Set to false  