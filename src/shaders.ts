// TODO glob deprecated
const shaderFiles = import.meta.glob('./shaders/*.{vert,frag}', { as: 'raw', eager: true });
// const shaderFiles = import.meta.glob('./shaders/*.{vert,frag}', { as: '?raw', eager: true }) as Record<string, string>; << Code doesn't work because it becomes a object.

export const ShaderMap: Record<string, string> = (() => {
    
    let tempShaderMap: Record<string, string> = {};

    for (let path in shaderFiles) {

        let fileName = path.split('/').pop()!;
        tempShaderMap[fileName] = shaderFiles[path];
    
    }

    return tempShaderMap;

})();


function getFileExtension(filename: string): string {

    const match = filename.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1] : '';

}

export class Attribute {
    name: string;
    componentNumber: number;
    type: number;
    // location: number | null = null;

    constructor(name: string, componentNumber: number, type: number) {
        this.name = name;
        this.componentNumber = componentNumber;
        this.type = type;
    }

    getName(): string {
        return this.name;
    }
    getComponentNumber(): number {
        return this.componentNumber;
    }
    getSize(): number {
        return this.componentNumber;
    }
    getType(): number {
        return this.type;
    }

}

export class Uniform {
    private name: string;
    private type: number;
    private callFunction: Function;

    constructor(name: string, type: number, callFunction: Function) {
        this.name = name;
        this.type = type;
        this.callFunction = callFunction;
    }

    getName(): string {
        return this.name;
    }
    getType(): number {
        return this.type;
    }
    getCallFunction(): Function {
        return this.callFunction;
    }

}

export class Shader {

    private gl: WebGL2RenderingContext;
    private shader!: WebGLShader; // It is initialized in the compile method.
    private type!: number; // It is initialized in the initShaderType method.
    private name: string;
    private source: string;

    private attributes: Map<string, Attribute> = new Map<string, Attribute>();
    private uniforms: Map<string, Uniform> = new Map<string, Uniform>();

    private compiled: boolean = false;
    private deleted: boolean = false;
    private attached: boolean = false;

    private program!: WebGLProgram; // It is initialized in the assignShader method.

    // TODO: Right now it always compiles the shader, but it should only compile if the shader is not already compiled.

    constructor(gl: WebGL2RenderingContext, shaderMap: Record<string, string>, shaderFullName: string) {

        this.gl = gl;
        this.name = shaderFullName;

        this.source = shaderMap[this.name];
        if (!this.source) throw new Error(`Shader not found: ${this.name}`);

        this.initShaderType();
        if (!this.type) throw new Error(`Unable to find type, ${this.name} failed.`);

        this.compile();
        if (!this.compiled) throw new Error(`Unable to create shader, ${this.name} failed.`);

        let tokens = this.tokenize();
        if (tokens.length === 0) throw new Error(`Unable to tokenize shader, ${this.name} failed.`);

        if (this.type === this.gl.VERTEX_SHADER) {
            this.mapAttributes(tokens);
        }

        this.MapUniforms(tokens);

    }

    attachShader(program: WebGLProgram) {

        this.program = program;
        this.gl.attachShader(program, this.shader);
        this.attached = true;

    }

    deattachShader() {
        if (this.deleted) return;
        this.gl.detachShader(this.program, this.shader);
    } // TODO

    delete() {
        if (this.deleted) return;
        this.gl.deleteShader(this.shader);
        this.deleted = true;
    } // TODO

    private tokenize(): string[] {
        const lines = this.source.split('\n');
        const tokens: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length > 0 && !trimmedLine.startsWith('//')) {
                tokens.push(trimmedLine);
            }
        }

        return tokens;
    }

    getAttributes(): Map<string, Attribute> {
        return this.attributes;
    }

    getUniforms(): Map<string, Uniform> {
        return this.uniforms;
    }

    private mapAttributes(tokens: string[]) {

        // TODO Improve perfomance.

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].startsWith('in')) {
                const parts = tokens[i].split(' ');
                const name = parts[parts.length - 1].replace(';', '');
                switch (parts[1]) {
                    case 'float':
                        this.attributes.set(name, new Attribute(name, 1, this.gl.FLOAT));
                        break;
                    case 'vec2':
                        this.attributes.set(name, new Attribute(name, 2, this.gl.FLOAT));
                        break;
                    case 'vec3':
                        this.attributes.set(name, new Attribute(name, 3, this.gl.FLOAT));
                        break;
                    case 'vec4':
                        this.attributes.set(name, new Attribute(name, 4, this.gl.FLOAT));
                        break;
                    // case 'mat2':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT2));                   ---  UNIFORM ONLY
                    //     break;
                    // case 'mat3':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT3));
                    //     break;
                    // case 'mat4':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT4));
                    //     break;
                    // case 'mat2x3':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT2x3));
                    //     break;
                    // case 'mat3x2':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT3x2));
                    //     break;
                    // case 'mat2x4':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT2x4));
                    //     break;
                    // case 'mat4x2':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT4x2));
                    //     break;
                    // case 'mat3x4':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT3x4));
                    //     break;
                    // case 'mat4x3':
                    //     this.attributes.set(name, new Attribute(name, this.gl.FLOAT_MAT4x3));
                        // break;                                                                                 --- UNIFORM ONLY
                    case 'int':
                        this.attributes.set(name, new Attribute(name, 1, this.gl.INT));
                        break;
                    case 'ivec2':
                        this.attributes.set(name, new Attribute(name, 2, this.gl.INT));
                        break;
                    case 'ivec3':
                        this.attributes.set(name, new Attribute(name, 3, this.gl.INT));
                        break;
                    case 'ivec4':
                        this.attributes.set(name, new Attribute(name, 4, this.gl.INT));
                        break;
                    case 'uint':
                        this.attributes.set(name, new Attribute(name, 1, this.gl.UNSIGNED_INT));
                        break;
                    case 'uvec2':
                        this.attributes.set(name, new Attribute(name, 2, this.gl.UNSIGNED_INT));
                        break;
                    case 'uvec3':
                        this.attributes.set(name, new Attribute(name, 3, this.gl.UNSIGNED_INT));
                        break;
                    case 'uvec4':
                        this.attributes.set(name, new Attribute(name, 4, this.gl.UNSIGNED_INT));
                        break;
                    // case 'bool':
                    //     this.attributes.set(name, new Attribute(name, this.gl.BOOL));                        --- UNIFORM ONLY
                    //     break;
                    // case 'bvec2':
                    //     this.attributes.set(name, new Attribute(name, this.gl.BOOL_VEC2));
                    //     break;
                    // case 'bvec3':
                    //     this.attributes.set(name, new Attribute(name, this.gl.BOOL_VEC3));
                    //     break;
                    // case 'bvec4':
                    //     this.attributes.set(name, new Attribute(name, this.gl.BOOL_VEC4));                   --- UNIFORM ONLY
                    //     break;
                    default:
                        throw new Error(`Unknown attribute type: ${parts[1]}`);
                }
            }
        }

    }

    private MapUniforms(tokens: string[]) {

        // TODO improve perfomance.

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].startsWith('uniform')) {
                const parts = tokens[i].split(' ');
                const name = parts[parts.length - 1].replace(';', '');
                switch (parts[1]) {
                    case 'float':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT, this.gl.uniform1f.bind(this.gl)));
                        break;
                    case 'vec2':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_VEC2, this.gl.uniform2fv.bind(this.gl)));
                        break;
                    case 'vec3':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_VEC3, this.gl.uniform3fv.bind(this.gl)));
                        break;
                    case 'vec4':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_VEC4, this.gl.uniform4fv.bind(this.gl)));
                        break;
                    case 'mat2':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT2, this.gl.uniformMatrix2fv.bind(this.gl)));
                        break;
                    case 'mat3':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT3, this.gl.uniformMatrix3fv.bind(this.gl)));
                        break;
                    case 'mat4':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT4, this.gl.uniformMatrix4fv.bind(this.gl)));
                        break;
                    case 'mat2x3':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT2x3, this.gl.uniformMatrix2x3fv.bind(this.gl)));
                        break;
                    case 'mat3x2':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT3x2, this.gl.uniformMatrix3x2fv.bind(this.gl)));
                        break;
                    case 'mat2x4':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT2x4, this.gl.uniformMatrix2x4fv.bind(this.gl)));
                        break;
                    case 'mat4x2':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT4x2, this.gl.uniformMatrix4x2fv.bind(this.gl)));
                        break;
                    case 'mat3x4':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT3x4, this.gl.uniformMatrix3x4fv.bind(this.gl)));
                        break;
                    case 'mat4x3':
                        this.uniforms.set(name, new Uniform(name, this.gl.FLOAT_MAT4x3, this.gl.uniformMatrix4x3fv.bind(this.gl)));
                        break;
                    case 'int':
                        this.uniforms.set(name, new Uniform(name, this.gl.INT, this.gl.uniform1i.bind(this.gl)));
                        break;
                    case 'ivec2':
                        this.uniforms.set(name, new Uniform(name, this.gl.INT_VEC2, this.gl.uniform2iv.bind(this.gl)));
                        break;
                    case 'ivec3':
                        this.uniforms.set(name, new Uniform(name, this.gl.INT_VEC3, this.gl.uniform3iv.bind(this.gl)));
                        break;
                    case 'ivec4':
                        this.uniforms.set(name, new Uniform(name, this.gl.INT_VEC4, this.gl.uniform4iv.bind(this.gl)));
                        break;
                    case 'uint':
                        this.uniforms.set(name, new Uniform(name, this.gl.UNSIGNED_INT, this.gl.uniform1ui.bind(this.gl)));
                        break;
                    case 'uvec2':
                        this.uniforms.set(name, new Uniform(name, this.gl.UNSIGNED_INT_VEC2, this.gl.uniform2uiv.bind(this.gl)));
                        break;
                    case 'uvec3':
                        this.uniforms.set(name, new Uniform(name, this.gl.UNSIGNED_INT_VEC3, this.gl.uniform3uiv.bind(this.gl)));
                        break;
                    case 'uvec4':
                        this.uniforms.set(name, new Uniform(name, this.gl.UNSIGNED_INT_VEC4, this.gl.uniform4uiv.bind(this.gl)));
                        break;
                    case 'bool':
                        this.uniforms.set(name, new Uniform(name, this.gl.BOOL, this.gl.uniform1i.bind(this.gl)));
                        break;
                    case 'bvec2':
                        this.uniforms.set(name, new Uniform(name, this.gl.BOOL_VEC2, this.gl.uniform2iv.bind(this.gl)));
                        break;
                    case 'bvec3':
                        this.uniforms.set(name, new Uniform(name, this.gl.BOOL_VEC3, this.gl.uniform3iv.bind(this.gl)));
                        break;
                    case 'bvec4':
                        this.uniforms.set(name, new Uniform(name, this.gl.BOOL_VEC4, this.gl.uniform4iv.bind(this.gl)));
                        break;
                    case 'sampler2D':
                        this.uniforms.set(name, new Uniform(name, this.gl.SAMPLER_2D, this.gl.uniform1i.bind(this.gl)));
                        break;
                    case 'samplerCube':
                        this.uniforms.set(name, new Uniform(name, this.gl.SAMPLER_CUBE, this.gl.uniform1i.bind(this.gl)));
                        break;
                    default:
                        throw new Error(`Unknown uniform type: ${parts[1]}`);
                }
            }
        }

    }

    private compile() {
        let tempShader = this.gl.createShader(this.type);
        if (!tempShader) throw new Error(`Unable to create shader, ${this.name} failed.`);

        this.gl.shaderSource(tempShader, this.source);
        this.gl.compileShader(tempShader);

        if (!this.gl.getShaderParameter(tempShader, this.gl.COMPILE_STATUS)) {
            // TODO Better error handling
            // console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            // gl.deleteShader(shader);
            throw new Error(`Unable to create shader, ${this.name} failed. ` + this.gl.getShaderInfoLog(tempShader));
        }

        this.compiled = true;
        this.deleted = false;
        this.shader = tempShader;

    }

    private initShaderType() {

        let ext = getFileExtension(this.name);

        switch (ext) {
            case 'vert': this.type = this.gl.VERTEX_SHADER; return;
            case 'frag': this.type = this.gl.FRAGMENT_SHADER; return;
            default:
            throw new Error(`Unknown shader type: ${ext}`);
        }
    
    }

}

// /**
// * 
// * Imports a shader from the shaders folder.
// *
// * @param {WebGL2RenderingContext} gl - The WebGL context.
// * @param {number} name - Name of the file to import.
// * @returns {WebGLShader} - The compiled shader.
// * @throws {Error} - If the shader is not found.
// * 
// */
// export function importShader(gl: WebGL2RenderingContext, name: string): WebGLShader {

//     let source = shaderMap[name];
//     if (!source) throw new Error(`Shader not found: ${name}`);

//     let type = null;

//     // Get shader type from file extension.
//     type = getShaderType(gl, getFileExtension(name));

//     if (!type) throw new Error(`Unable to find type, ${name} failed.`);

//     let shader = gl.createShader(type)!;
//     if (!shader) throw new Error(`Unable to create shader, ${name} failed.`);

//     gl.shaderSource(shader, source);
//     gl.compileShader(shader);

//     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//         // TODO Better error handling
//         // console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
//         // gl.deleteShader(shader);
//         throw new Error(`Unable to create shader, ${name} failed. ` + gl.getShaderInfoLog(shader));
//     }

//     return shader;
// }