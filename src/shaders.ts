// TODO glob deprecated
const shaderFiles = import.meta.glob('./shaders/*.{vert,frag}', { as: 'raw', eager: true });

const shaderMap: Record<string, string> = {};

for (const path in shaderFiles) {
  const fileName = path.split('/').pop()!;
  shaderMap[fileName] = shaderFiles[path];
}

export function importShader(name: string): string {
  const shader = shaderMap[name];
  if (!shader) throw new Error(`Shader not found: ${name}`);
  return shader;
}

// // src/shaders.ts
// import planetVert from './shaders/planet.vert';
// import planetFrag from './shaders/planet.frag';
// import atmosphereVert from './shaders/atmosphere.vert';
// import atmosphereFrag from './shaders/atmosphere.frag';
// import backgroundVert from './shaders/background.vert';
// import backgroundFrag from './shaders/background.frag';

// const shaderMap: Record<string, string> = {
//     'planet.vert': planetVert,
//     'planet.frag': planetFrag,
//     'atmosphere.vert': atmosphereVert,
//     'atmosphere.frag': atmosphereFrag,
//     'background.vert': backgroundVert,
//     'background.frag': backgroundFrag,
// };

// export function importShader(name: string): string {
//   const shader = shaderMap[name];
//   if (!shader) throw new Error(`Shader not found: ${name}`);
//   return shader;
// }

// Compile shaders
export function compileShader(gl: WebGL2RenderingContext, source: string, type: GLenum) {
    let shader = gl.createShader(type);
    if (!shader) throw new Error(`Unable to create shader, ${source} failed.`);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        // gl.deleteShader(shader);
        throw new Error(`Unable to create shader, ${source} failed. ` + gl.getShaderInfoLog(shader));
    }

    return shader;
}