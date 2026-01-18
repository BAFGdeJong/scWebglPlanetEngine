// TODO glob deprecated
const webglShaderFiles = import.meta.glob('./shaders/*.{vert,frag}', {
  as: 'raw', // Treat them as raw text
  eager: true, // Load them immediately at startup
});

const webgpuShaderFiles = import.meta.glob('./shaders/*.wgsl', {
  as: 'raw', // Treat them as raw text
  eager: true, // Load them immediately at startup
});

export const WebglShader = (() => {
  let tempShaderMap: any = {};

  for (let path in webglShaderFiles) {
    let fileName = path.replace('./shaders/', '');
    // TODO remove vert/frag

    tempShaderMap[fileName] = webglShaderFiles[path];
  }

  return tempShaderMap;
})();

export const WebgpuShader = (() => {
  let tempShaderMap: any = {};

  for (let path in webgpuShaderFiles) {
    let fileName = path.replace('./shaders/', '');
    fileName = fileName.replace('.wgsl', '');

    tempShaderMap[fileName] = webgpuShaderFiles[path];
  }

  return tempShaderMap;
})();
