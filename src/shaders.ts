// src/shaders.ts
import planetVert from './shaders/planet.vert';
import planetFrag from './shaders/planet.frag';

const shaderMap: any = {
  'planet.vert': planetVert,
  'planet.frag': planetFrag,
};

export function importShader(name: string): string {
  const shader = shaderMap[name];
  if (!shader) throw new Error(`Shader not found: ${name}`);
  return shader;
}

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