// TODO glob deprecated
const shaderFiles = import.meta.glob('./shaders/*.{vert,frag}', {
    as: 'raw', // Treat them as raw text
    eager: true, // Load them immediately at startup
});

export const ShaderMap = (() => {
    let tempShaderMap: any = {};
  
    for (let path in shaderFiles) {
      let fileName = path.replace('./shaders/', '');
  
      tempShaderMap[fileName] = shaderFiles[path];
    }
  
    return tempShaderMap;
})();