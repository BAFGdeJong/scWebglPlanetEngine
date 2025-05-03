import { ShaderManager, ProgramPackage } from "./shadermanager";
import { createMat4, translate, rotate, rotateX, rotateY, rotateZ, scale } from "./utils";

type objectBuffer = {
    buffer: WebGLBuffer,
    bufferType: GLenum,
    usage: GLenum
}

export class BackgroundObject {

    private gl: WebGL2RenderingContext;
    private shaderManager: ShaderManager;
    private currentProgramPackage: ProgramPackage | null = null;

    private data: Record<string, any> = {};
    private vao: WebGLVertexArrayObject | null = null;
    private buffers: Record<string, objectBuffer> = {};

    constructor(
        gl: WebGL2RenderingContext,
        shaderManager: ShaderManager,
    ) {
        this.gl = gl;
        this.shaderManager = shaderManager;

        this.createQuad();

        this.buffers.positions = {buffer: this.gl.createBuffer(), bufferType: this.gl.ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};
        this.buffers.texCoord = {buffer: this.gl.createBuffer(), bufferType: this.gl.ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};

        if (!this.buffers.positions || !this.buffers.texCoord) {
            console.error('Failed to create a buffer');
            return;
        }

    }

    setShaderProgram(programName: string) {
        let program = this.shaderManager.getProgramPackage(programName);

        if (program) {
            this.currentProgramPackage = program;
            this.gl.useProgram(program.program);
        } else {
            console.warn(`Shader program ${programName} not found`);
        }

    }

    private bind(bufferName: string) {
        this.gl.bindBuffer(this.buffers[bufferName].bufferType, this.buffers[bufferName].buffer);
    }

    private setBufferData(bufferName: string) {
        this.bind(bufferName);
        this.gl.bufferData(this.buffers[bufferName].bufferType, this.data[bufferName], this.buffers[bufferName].usage);
    // TODO ^ not always same name
    }

    setBuffers() {

        if (!this.currentProgramPackage?.program) return; // TODO logging

        let aPositionLocation = this.gl.getAttribLocation(this.currentProgramPackage.program, "aPosition");
        let aTexCoordLocation = this.gl.getAttribLocation(this.currentProgramPackage.program, "aTexCoord"); // TODO not good to hardcode, good enough for now.

        if (aPositionLocation === -1 || aTexCoordLocation === -1) {
            console.error("Shader attributes missing.");
            return; // TODO more logging like what is missing?
        }

        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        this.setBufferData('positions'); // < TODO, should check if there is a buffer.
        this.gl.enableVertexAttribArray(aPositionLocation);
        this.gl.vertexAttribPointer(aPositionLocation, 2, this.gl.FLOAT, false, 0, 0); // < TODO this.gl.FLOAT can be automated, harcoded not good.

        this.setBufferData('texCoord');
        this.gl.enableVertexAttribArray(aTexCoordLocation);
        this.gl.vertexAttribPointer(aTexCoordLocation, 2, this.gl.FLOAT, false, 0, 0); // < TODO this.gl.FLOAT can be automated, harcoded not good.

        this.gl.bindVertexArray(null);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

    }

    createQuad() {

        this.data['positions'] = new Float32Array([
            // x, y
            -1, -1,
            1, -1,
            -1,  1,
            1,  1,
        ]);

        this.data['texCoord'] = new Float32Array([
        //  U  V
            0, 0,
            1, 0,
            0, 1,
            1, 1,
        ]);

    }

    render() {
        if (!this.currentProgramPackage || !this.vao) {
            console.log("Indices:", this.data.indices);
            console.log("Program:", this.currentProgramPackage);
            console.log("VAO:", this.vao);
            console.error('ERROR: Missing required resources.');
            return;
        }

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND)
        this.gl.depthMask(false);

        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.bindVertexArray(null);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND)
        this.gl.depthMask(true);
    }

}

export class SphereObject {

    private gl: WebGL2RenderingContext;
    private shaderManager: ShaderManager;
    private currentProgramPackage: ProgramPackage | null = null;

    private data: Record<string, any> = {};
    private vao: WebGLVertexArrayObject | null = null;
    // private possibleAttributes: Array<string> = [
    //     "aPosition", "aTexCoord", "aNormal", "aIndices", "aNormalLines"
    // ]
    private buffers: Record<string, objectBuffer> = {};
    
    private modelMatrix: any[] | Float32Array<ArrayBuffer>;

    constructor(
        gl: WebGL2RenderingContext,
        shaderManager: ShaderManager,
        radius: number,
        subdivisions: number,
        modelMatrix: any[] | Float32Array<ArrayBuffer>,
    ) {
        this.gl = gl;
        this.shaderManager = shaderManager;
        this.modelMatrix = modelMatrix;

        this.createSphere(subdivisions, radius);

        this.buffers.positions = {buffer: this.gl.createBuffer(), bufferType: this.gl.ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};
        this.buffers.normals = {buffer: this.gl.createBuffer(), bufferType: this.gl.ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};
        this.buffers.texCoord = {buffer: this.gl.createBuffer(), bufferType: this.gl.ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};
        this.buffers.indices = {buffer: this.gl.createBuffer(), bufferType: this.gl.ELEMENT_ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};

        if (!this.buffers.positions || !this.buffers.normals || !this.buffers.texCoord || !this.buffers.indices) {
            console.error('Failed to create a buffer');
            return;
        }

    }

    setShaderProgram(programName: string) {
        let program = this.shaderManager.getProgramPackage(programName);

        if (program) {
            this.currentProgramPackage = program;
            this.gl.useProgram(program.program);
        } else {
            console.warn(`Shader program ${programName} not found`);
        }

    }

    setModelMatrix(
        position: [number, number, number],
        rotation: [number, number, number],
        scaleO: [number, number, number]
    ) {
        // T translation transform
        // R rotation transform
        // S scale transform
        // this.modelMatrix = T * R * S;

        this.modelMatrix = createMat4();

        translate(this.modelMatrix, this.modelMatrix, position);
        rotateZ(this.modelMatrix, this.modelMatrix, rotation[2]);
        rotateY(this.modelMatrix, this.modelMatrix, rotation[1]);
        rotateX(this.modelMatrix, this.modelMatrix, rotation[0]);
        scale(this.modelMatrix, this.modelMatrix, scaleO);
        
    }

    getLocalRotation() {
        // Extract the rotation part of the model matrix (top-left 3x3 submatrix)
        let m = this.modelMatrix;
        
        return {
            x: Math.atan2(m[6], m[10]), // Rotation around X axis
            y: Math.atan2(-m[2], Math.sqrt(m[6] * m[6] + m[10] * m[10])), // Rotation around Y axis
            z: Math.atan2(m[1], m[0])  // Rotation around Z axis
        };
    }

    getLocalScale() {
        // Extract the scale from the diagonal of the 3x3 matrix (no skewing)
        let m = this.modelMatrix;
        
        return {
            x: Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]), // Scale factor along X
            y: Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]), // Scale factor along Y
            z: Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]) // Scale factor along Z
        };
    }

    getLocalPosition() {
        return {
            x: this.modelMatrix[12],
            y: this.modelMatrix[13],
            z: this.modelMatrix[14],
        };
    }

    private bind(bufferName: string) {
        this.gl.bindBuffer(this.buffers[bufferName].bufferType, this.buffers[bufferName].buffer);
    }

    private setBufferData(bufferName: string) {
        this.bind(bufferName);
        this.gl.bufferData(this.buffers[bufferName].bufferType, this.data[bufferName], this.buffers[bufferName].usage);
    // TODO ^ not always same name
    }

    setBuffers() {

        if (!this.currentProgramPackage?.program) return; // TODO logging
        // let attri = this.currentProgramPackage.shaderPackage.attributes;
        // let unifs = this.currentProgramPackage.shaderPackage.uniforms;

        let aPositionLocation  = this.gl.getAttribLocation(this.currentProgramPackage.program, "aPosition");
        let aTexCoordLocation  = this.gl.getAttribLocation(this.currentProgramPackage.program, "aTexCoord"); // TODO not good to hardcode, good enough for now.
        let aNormalLocation    = this.gl.getAttribLocation(this.currentProgramPackage.program, "aNormal"); // Needs to be other way, Where we check if object has the shaders var.

        if (aPositionLocation === -1 || aTexCoordLocation === -1 || aNormalLocation === -1) {
            console.error("Shader attributes missing.");
            return; // TODO more logging like what is missing?
        }

        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        this.setBufferData('positions'); // < TODO, should check if there is a buffer.
        this.gl.enableVertexAttribArray(aPositionLocation);
        this.gl.vertexAttribPointer(aPositionLocation, 3, this.gl.FLOAT, false, 0, 0); // < TODO this.gl.FLOAT can be automated, harcoded not good.

        this.setBufferData('texCoord');
        this.gl.enableVertexAttribArray(aTexCoordLocation);
        this.gl.vertexAttribPointer(aTexCoordLocation, 2, this.gl.FLOAT, false, 0, 0); // < TODO this.gl.FLOAT can be automated, harcoded not good.

        this.setBufferData('normals');
        this.gl.enableVertexAttribArray(aNormalLocation);
        this.gl.vertexAttribPointer(aNormalLocation, 3, this.gl.FLOAT, false, 0, 0); // < TODO this.gl.FLOAT can be automated, harcoded not good.

        this.setBufferData('indices');

        this.gl.bindVertexArray(null);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

    }

    render() {
        if (!this.data.indices || !this.currentProgramPackage || !this.vao) {
            console.log("Indices:", this.data.indices);
            console.log("Program:", this.currentProgramPackage);
            console.log("VAO:", this.vao);
            console.error('ERROR: Missing required resources.');
            return;
        }

        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.currentProgramPackage.program!, 'uModelMatrix'), false, this.modelMatrix);

        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.data.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
    }

    private createSphere(subdivisions: number, radius: number) {
        let positions = [];
        let normals = [];
        let texCoord = [];
        let indices = [];
        let normalLines = [];
    
        for (let lat = 0; lat <= subdivisions; lat++) {
            let theta = (lat * Math.PI) / subdivisions;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);
    
            for (let lon = 0; lon <= subdivisions; lon++) {
                let phi = (lon * 2 * Math.PI) / subdivisions;
                let sinPhi = Math.sin(phi);
                let cosPhi = Math.cos(phi);
                let x = radius * cosPhi * sinTheta;
                let y = radius * cosTheta;
                let z = radius * sinPhi * sinTheta;
    
                let length = Math.sqrt(x * x + y * y + z * z);
                normals.push(x / length, y / length, z / length);
    
                let u = lon / subdivisions;
                let v = lat / subdivisions;
                if (lat === 0 || lat === subdivisions) {
                    v += 0.0001;
                }
    
                positions.push(x, y, z);
                texCoord.push(u, v);
            }
        }
    
        // Generate indices
        for (let lat = 0; lat < subdivisions; lat++) {
            for (let lon = 0; lon < subdivisions; lon++) {
                let first = lat * (subdivisions + 1) + lon;
                let second = first + subdivisions + 1;
    
                indices.push(first, first + 1, second);
                indices.push(second, first + 1, second + 1);
            }
        }
    
        for (let i = 0; i < positions.length; i += 3) {
            let px = positions[i];
            let py = positions[i + 1];
            let pz = positions[i + 2];
    
            let nx = normals[i];
            let ny = normals[i + 1];
            let nz = normals[i + 2];
    
            normalLines.push(px, py, pz);
            normalLines.push(px + nx * 0.1, py + ny * 0.1, pz + nz * 0.1);
        }
    
        this.data['positions'] = new Float32Array(positions);
        this.data['normals'] = new Float32Array(normals);
        this.data['texCoord'] = new Float32Array(texCoord);
        this.data['indices'] = new Uint16Array(indices);
        this.data['normalLines'] = new Float32Array(normalLines);
    }

}