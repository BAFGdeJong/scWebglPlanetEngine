// TODO glob deprecated
const shaderFiles = import.meta.glob('./shaders/*.{vert,frag}', { as: 'raw', eager: true });
// const shaderFiles = import.meta.glob('./shaders/*.{vert,frag}', { as: '?raw', eager: true }) as Record<string, string>; << Code doesn't work because it becomes a object.

const shaderMap: Record<string, string> = {};

for (const path in shaderFiles) {

    const fileName = path.split('/').pop()!;
    shaderMap[fileName] = shaderFiles[path];

}

// Should be moved to utils
/**
* 
* Gets the file extension from a filename.
*
* @param {string} filename - Name of the file to import.
* @returns {string} The file extension.
* 
*/
function getFileExtension(filename: string): string {

    const match = filename.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1] : '';

}

/**
* 
* Gets the shader type from the file extension.
*
* @param {WebGLRenderingContext} gl - The WebGL context.
* @param {WebGLRenderingContext} ext - The file extension.
* @returns {number} The shader type.
* @throws {Error} If unknown shader type.
* 
*/
function getShaderType(gl: WebGLRenderingContext, ext: string): number {

    switch (ext) {
        case 'vert': return gl.VERTEX_SHADER;
        case 'frag': return gl.FRAGMENT_SHADER;
        default:
        throw new Error(`Unknown shader type: .${ext}`);
    }

}

/**
* 
* Imports a shader from the shaders folder.
*
* @param {WebGL2RenderingContext} gl - The WebGL context.
* @param {number} name - Name of the file to import.
* @returns {WebGLShader} The compiled shader.
* @throws {Error} If the shader is not found.
* 
*/
export function importShader(gl: WebGL2RenderingContext, name: string): WebGLShader {

    let source = shaderMap[name];
    if (!source) throw new Error(`Shader not found: ${name}`);

    let type = null;

    // Get shader type from file extension.
    type = getShaderType(gl, getFileExtension(name));

    if (!type) throw new Error(`Unable to find type, ${name} failed.`);

    let shader = gl.createShader(type)!;
    if (!shader) throw new Error(`Unable to create shader, ${name} failed.`);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // TODO Better error handling
        // console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        // gl.deleteShader(shader);
        throw new Error(`Unable to create shader, ${name} failed. ` + gl.getShaderInfoLog(shader));
    }

    return shader;
}