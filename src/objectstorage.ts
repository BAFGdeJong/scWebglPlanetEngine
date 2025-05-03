import { ShaderManager } from "./shadermanager";

type objectBuffer = {
    buffer: WebGLBuffer,
    bufferType: GLenum,
    usage: GLenum
}

export class SphereObject {

    private gl: WebGL2RenderingContext;
    private shaderManager: ShaderManager;
    private currentProgram: WebGLProgram | null = null;

    // private positions: Float32Array | null = null;
    // private normals: Float32Array | null = null;
    // private texCoords: Float32Array | null = null;
    // private indices: Uint16Array | null = null;
    // private normalLines: Float32Array | null = null;
    private data: Record<string, any> = {};
    private vao: WebGLVertexArrayObject | null = null;
    private buffers: Record<string, objectBuffer> = {};

    // private positionsBuffer;
    // private normalsBuffer;
    // private texCoordsBuffer;
    // private indicesBuffer;

    constructor(gl: WebGL2RenderingContext, shaderManager: ShaderManager, radius: number, subdivisions: number) {
        this.gl = gl;
        this.shaderManager = shaderManager;

        this.createSphere(subdivisions, radius);

        this.buffers.positions = {buffer: this.gl.createBuffer(), bufferType: this.gl.ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};
        this.buffers.normals = {buffer: this.gl.createBuffer(), bufferType: this.gl.ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};
        this.buffers.texCoords = {buffer: this.gl.createBuffer(), bufferType: this.gl.ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};
        this.buffers.indices = {buffer: this.gl.createBuffer(), bufferType: this.gl.ELEMENT_ARRAY_BUFFER, usage: this.gl.STATIC_DRAW};

        if (!this.buffers.positions || !this.buffers.normals || !this.buffers.texCoords || !this.buffers.indices) {
            console.error('Failed to create a buffer');
            return;
        }

    }

    setShaderProgram(programName: string) {
        let program = this.shaderManager.getProgram(programName);

        if (program) {
            this.currentProgram = program;
            this.gl.useProgram(program);
        } else {
            console.warn(`Shader program ${programName} no found`);
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

        if (!this.currentProgram) return; // TODO logging

        let aPositionLocation  = this.gl.getAttribLocation(this.currentProgram, "aPosition");
        let aTexCoordLocation  = this.gl.getAttribLocation(this.currentProgram, "aTexCoord"); // TODO not good to hardcode, good enough for now.
        let aNormalLocation    = this.gl.getAttribLocation(this.currentProgram, "aNormal");

        if (aPositionLocation === -1 || aTexCoordLocation === -1 || aNormalLocation === -1) {
            console.error("Shader attributes missing.");
            return; // TODO more logging like what is missing?
        }

        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        this.setBufferData('positions'); // < TODO, should check if there is a buffer.
        this.gl.enableVertexAttribArray(aPositionLocation);
        this.gl.vertexAttribPointer(aPositionLocation, 3, this.gl.FLOAT, false, 0, 0); // < TODO this.gl.FLOAT can be automated, harcoded not good.

        this.setBufferData('texCoords');
        this.gl.enableVertexAttribArray(aPositionLocation);
        this.gl.vertexAttribPointer(aPositionLocation, 2, this.gl.FLOAT, false, 0, 0); // < TODO this.gl.FLOAT can be automated, harcoded not good.

        this.setBufferData('normals');
        this.gl.enableVertexAttribArray(aPositionLocation);
        this.gl.vertexAttribPointer(aPositionLocation, 3, this.gl.FLOAT, false, 0, 0); // < TODO this.gl.FLOAT can be automated, harcoded not good.

        this.setBufferData('indices');

        this.gl.bindVertexArray(null);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

    }

    // getPositions() {
    //     return this.positions;
    // }
    // getNormals() {
    //     return this.normals;
    // }
    // getTexCoords() {
    //     return this.texCoords;
    // }
    // getIndices() {
    //     return this.indices;
    // }
    // getNormalLines() {
    //     return this.normalLines;
    // }

    render() {
        if (!this.data.indices || !this.currentProgram || !this.vao) {
            console.log("Indices:", this.data.indices);
            console.log("Program:", this.currentProgram);
            console.log("VAO:", this.vao);
            console.error('ERROR: Missing required resources.');
            return;
        }

        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.data.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
    }

    private createSphere(subdivisions: number, radius: number) {
        const positions = [];
        const normals = [];
        const texCoords = [];
        const indices = [];
        const normalLines = [];
    
        for (let lat = 0; lat <= subdivisions; lat++) {
            const theta = (lat * Math.PI) / subdivisions;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
    
            for (let lon = 0; lon <= subdivisions; lon++) {
                const phi = (lon * 2 * Math.PI) / subdivisions;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
    
                const x = radius * cosPhi * sinTheta;
                const y = radius * cosTheta;
                const z = radius * sinPhi * sinTheta;
    
                const length = Math.sqrt(x * x + y * y + z * z);
                normals.push(x / length, y / length, z / length);
    
                const u = lon / subdivisions;
                let v = lat / subdivisions;
                if (lat === 0 || lat === subdivisions) {
                    v += 0.0001;
                }
    
                positions.push(x, y, z);
                texCoords.push(u, v);
            }
        }
    
        // Generate indices
        for (let lat = 0; lat < subdivisions; lat++) {
            for (let lon = 0; lon < subdivisions; lon++) {
                const first = lat * (subdivisions + 1) + lon;
                const second = first + subdivisions + 1;
    
                indices.push(first, first + 1, second);
                indices.push(second, first + 1, second + 1);
            }
        }
    
        for (let i = 0; i < positions.length; i += 3) {
            const px = positions[i];
            const py = positions[i + 1];
            const pz = positions[i + 2];
    
            const nx = normals[i];
            const ny = normals[i + 1];
            const nz = normals[i + 2];
    
            normalLines.push(px, py, pz);
            normalLines.push(px + nx * 0.1, py + ny * 0.1, pz + nz * 0.1);
        }
    
        this.data['positions'] = new Float32Array(positions);
        this.data['normals'] = new Float32Array(normals);
        this.data['texCoords'] = new Float32Array(texCoords);
        this.data['indices'] = new Uint16Array(indices);
        this.data['normalLines'] = new Float32Array(normalLines);
    }

}