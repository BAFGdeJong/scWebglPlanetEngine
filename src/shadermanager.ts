
/**
* 
* Creates a shader manager to manage shaders.
*
* @param {WebGL2RenderingContext} gl - The WebGL context.
* @returns {ShaderManager} - ShaderManager to manage ShaderPackages.
* 
*/
export class ShaderManager {
    private gl: WebGL2RenderingContext;
    private programPackages: Map<String, ProgramPackage> = new Map();
    private shaderPackages: Map<string, ShaderPackage> = new Map();

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    /**
    * 
    * Creates a program and links it to a shader package.
    * 
    * @param {string} programName - Name of the program to create.
    * @param {string} shaderPackageName - Name of the shader package to attach to the program.
    * 
    */
    createProgram(programName: string, shaderPackageName: string): void {
        let program = this.gl.createProgram();
        let shaderPackage: ShaderPackage = this.shaderPackages.get(shaderPackageName)!;
        if (!shaderPackage) {return} // TODO error handling and logging

        this.gl.attachShader(program, shaderPackage.vertShader);
        this.gl.attachShader(program, shaderPackage.fragShader);

        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            throw `Could not compile WebGL program. \n\n${info}`;
        }

        this.programPackages.set(programName, {
            name: programName,
            program: program,
            shaderPackage: shaderPackage
        });

    }

    getAttributes(programName: string) { // TODO error handling
        return this.programPackages.get(programName)?.shaderPackage.attributes;
    }

    getUniforms(programName: string) { // TODO error handling
        return this.programPackages.get(programName)?.shaderPackage.uniforms;
    }

    getProgram(programName: string): WebGLProgram | undefined { // TODO error handling
        return this.programPackages.get(programName)?.program;
    }

    getProgramPackage(programName: string) { // TODO error handling
        return this.programPackages.get(programName);
    }

    // getProgramName(program: WebgL) { MAYBE DO THIS??

    // }

    useProgram(programName: string): void {
        let program = this.getProgram(programName);

        if (program) {
            this.gl.useProgram(program)
        } // TODO error handling and logging
    }

    deleteProgram(programName: string): void {
        let program = this.getProgram(programName);

        if (program) {
            this.gl.deleteProgram(program);
            this.programPackages.delete(programName);
        } // TODO error handling and logging

    }

    /**
    * 
    * Creates a shader package.
    * 
    * @param {string} name - Name of the to be created package.
    * @param {string} vertexSource - the source of the vertex shader.
    * @param {string} fragmentShader - The source of the fragment shader.
    * 
    */
    createShaderPackage(name: string, vertexSource: string, fragmentSource: string): void {

        let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        let fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) {return} // TODO log
        this.gl.shaderSource(vertexShader, vertexSource);
        this.gl.compileShader(vertexShader);
        if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
            console.error('Vertex shader compile error:', this.gl.getShaderInfoLog(vertexShader));
        }
        this.gl.shaderSource(fragmentShader, fragmentSource);
        this.gl.compileShader(fragmentShader);
        if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
            console.error('Fragment shader compile error:', this.gl.getShaderInfoLog(fragmentShader));
        }

        let tempProgram = this.gl.createProgram();
        this.gl.attachShader(tempProgram, vertexShader);
        this.gl.attachShader(tempProgram, fragmentShader);
        this.gl.linkProgram(tempProgram);

        if (this.gl.getProgramParameter(tempProgram, this.gl.LINK_STATUS)) { // TODO error handling, log
            let atts: Attributes = {};

            for (let i = 0; i < this.gl.getProgramParameter(tempProgram, this.gl.ACTIVE_ATTRIBUTES); i++) {
                let a = this.gl.getActiveAttrib(tempProgram, i);
                if (a) {atts[a.name] = a}
            }

            let unifs: Uniforms = {};

            for (let i = 0; i < this.gl.getProgramParameter(tempProgram, this.gl.ACTIVE_UNIFORMS); i++) {
                let a = this.gl.getActiveUniform(tempProgram, i);
                if (a) {unifs[a.name] = a}
            }

            this.shaderPackages.set(name, {
                vertShader: vertexShader,
                fragShader: fragmentShader,
                uniforms: unifs,
                attributes: atts
            });
        }

        this.gl.deleteProgram(tempProgram);

    }

    getUniformLocation(program: WebGLProgram, uniformName: string) {
        return this.gl.getUniformLocation(program, uniformName);
    }

    assignTexture(uniformLocation: WebGLUniformLocation, textureObject: WebGLTexture, id: number) {
        this.gl.activeTexture(this.gl.TEXTURE0 + id);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureObject);
        this.gl.uniform1i(uniformLocation, id);
    }

    /**
    * 
    * Deletes the shader package (including shaders).
    * 
    * ONLY DELETE IF IT'S NOT ATTACHED TO A PROGRAM.
    *
    * TODO better program relation.
    * 
    * @param {string} name - Name of the shader package.
    * 
    */
    deleteShaderPackage(name: string): void {
        let shaderPackage: ShaderPackage = this.shaderPackages.get(name)!;
        if (!shaderPackage) {
            return // TODO logging and error handling
        }

        if (!this.shaderPackages.delete(name)) {
            return // TODO logging and error handling
        }

        this.gl.deleteShader(shaderPackage.fragShader);
        this.gl.deleteShader(shaderPackage.vertShader);

    }

}

export type ProgramPackage = {
    name: string;
    program: WebGLProgram;
    shaderPackage: ShaderPackage;
}

type ShaderPackage = {
    fragShader: WebGLShader;
    vertShader: WebGLShader;
    uniforms: Uniforms;
    attributes: Attributes;
}

type Uniforms = {
    [name: string]: UniformValue;
};

type UniformValue = {
    name: string,
    type: GLenum,
    size: number
}
    // | number
    // | [number, number]
    // | [number, number, number]
    // | [number, number, number, number]
    // | number[]
    // | WebGLTexture
    // | Int32Array | Float32Array;

type Attributes = {
    [name: string]: AttributeValue;
};

type AttributeValue = {
    name: string,
    type: GLenum,
    size: number
    // buffer: WebGLBuffer;
    // size: number;
    // type: number;
    // normalized?: boolean;
    // stride?: number;
    // offset?: number;
};