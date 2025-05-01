import * as utils from './utils.js';
import { ShaderMap, Shader, Uniform, Attribute} from './shaders.ts';
import { TextureMap, Texture } from './textures.ts';

abstract class ModelObject {
    protected gl: WebGL2RenderingContext;
    protected buffer: WebGLBuffer;
    protected object: any; // TODO Define a better type for this
    protected bufferArrayType: number;
    protected bufferType: number;


    constructor(gl: WebGL2RenderingContext, bufferArrayType: number, bufferType: number) {
        this.gl = gl;
        this.bufferArrayType = bufferArrayType;
        this.bufferType = bufferType;

        this.buffer = this.gl.createBuffer();
        if (!this.buffer) {
            console.error('Failed to create buffer');
            return;
        }

    }

    getBuffer() {
        return this.buffer;
    }

    abstract setBuffer(): void;
    abstract draw(): void;

}

abstract class Object3D extends ModelObject {
}

// abstract class Object3D extends ModelObject {
//     constructor(
//         positions: Float32Array,
//         normals: Float32Array,
//         textCoords: Float32Array,
//         indices: Uint16Array
//     ) {
//         super(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
//         this.positions = positions;
//         this.normals = normals;
//         this.textCoords = textCoords;
//         this.indices = indices;
//     }

//     abstract draw(): void;
// }

// TODO move this to a separate file
// class ModelObject {
//     private gl: WebGL2RenderingContext;
//     private buffer: WebGLBuffer;
//     private object: any; // TODO Define a better type for this

//     constructor(gl: WebGL2RenderingContext, object: any) {

//         this.gl = gl;
//         this.object = object;

//         this.buffer = this.gl.createBuffer();
//         if (!this.buffer) {
//             console.error('Failed to create buffer');
//             return;
//         }

//         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
//         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.object.indices, gl.STATIC_DRAW); // TODO needs to be more flexible, not just indices and static draw

//     }

//     getBuffer() {
//         return this.buffer;
//     }

//     drawObject() {
//         this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffer);
//         this.gl.drawElements(this.gl.TRIANGLES, this.object.indices.length, this.gl.UNSIGNED_SHORT, 0); // TODO needs to be more flexible, not just indices and static draw
//     }

// }

class SphereObject extends Object3D {

    private positions: Float32Array | null;
    private normals: Float32Array | null;
    private texCoords: Float32Array | null;
    private indices: Uint16Array | null;
    private normalLines: Float32Array | null;

    constructor(gl: WebGL2RenderingContext, radius: number, subdivisions: number) {
        super(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
        this.gl = gl;

        this.positions = null;
        this.normals = null;
        this.texCoords = null;
        this.indices = null;
        this.normalLines = null;

        this.createSphere(subdivisions, radius);

        this.buffer = this.gl.createBuffer();
        if (!this.buffer) {
            console.error('Failed to create buffer');
            return;
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
        gl.bufferData(this.bufferArrayType, this.indices, this.bufferType);


    }

    getPositions() {
        return this.positions;
    }
    getNormals() {
        return this.normals;
    }
    getTexCoords() {
        return this.texCoords;
    }
    getIndices() {
        return this.indices;
    }
    getNormalLines() {
        return this.normalLines;
    }

    setBuffer() {
    }

    draw() {
        if (!this.indices) {
            console.error('No indices to draw');
            return;
        }

        this.gl.bindBuffer(this.bufferArrayType, this.buffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
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
    
        this.positions = new Float32Array(positions);
        this.normals = new Float32Array(normals);
        this.texCoords = new Float32Array(texCoords);
        this.indices = new Uint16Array(indices);
        this.normalLines = new Float32Array(normalLines);
    }

}

// class AttachedModelObject {
//     private gl: WebGL2RenderingContext;
//     private program: WebGLProgram;
//     private object: ModelObject;

//     constructor(gl: WebGL2RenderingContext, program: WebGLProgram, object: ModelObject) {
//         this.gl = gl;
//         this.program = program;
//         this.object = object;
//     }

//     getBuffer() {
//         return this.object.getBuffer();
//     }

// }

class ProgramAttachedUniform {

    // TODO Cleanup garbage code.

    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private uniform: Uniform;
    private location: WebGLUniformLocation | null = null;

    constructor(gl: WebGL2RenderingContext, program: WebGLProgram, uniform: Uniform) {
        this.gl = gl;
        this.program = program;
        this.uniform = uniform;
        this.attachUniform();
    }

    private attachUniform() {

        this.location = this.gl.getUniformLocation(this.program, this.uniform.getName());

        if (this.location === null) {
            console.error(`Uniform location not found for ${this.uniform.getName()}`);
            return;
        }

    }

    setUniform(
        ...args: any[]
    ) {

        this.uniform.getCallFunction().call(this.gl, this.location, ...args);

    }
}

class ProgramAttachedAttribute {

    // TODO Cleanup garbage code.

    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private attribute: Attribute;
    private location: number | null = null;
    private buffer: WebGLBuffer | null = null;

    constructor(
        gl: WebGL2RenderingContext, 
        program: WebGLProgram, 
        attribute: Attribute,
        // data: any,
        // dataSize: number,
        // type: number,
        // normalized: boolean,
        // stride: number,
        // offset: number
    ) {
        this.gl = gl;
        this.program = program;
        this.attribute = attribute;
        this.attachAttribute();
    }

    private attachAttribute() {
        this.buffer = this.gl.createBuffer();
    }

    setAttribute(data: any, normalized: boolean) {

        this.location = this.gl.getAttribLocation(this.program, this.attribute.getName());
        if (this.location === -1) {
            console.error(`Attribute ${this.attribute.getName()} not found in the shader program.`);
            return;
        }
    
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

        this.gl.vertexAttribPointer(
            this.location,
            this.attribute.getSize(),
            this.attribute.getType(),
            normalized,
            0, // Only needed for interleaved arrays, using 1 buffer per attribute
            0 // Only needed for interleaved arrays, using 1 buffer per attribute
        );

        this.gl.enableVertexAttribArray(this.location); // TODO Error handling

    }

}

/**
* 
* Creates a shader program from vertex and fragment shaders.
*
* @param {WebGL2RenderingContext} gl - The WebGL context.
* @param {string} vertexShader - Name of the file to import.
* @param {string} fragmentShader - Name of the file to import.
* @returns {ShaderProgram} - The compiled shader.
* 
*/
export class ShaderProgram {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private vertexShader: Shader;
    private fragmentShader: Shader;
    private attachedUniforms: Map<string, ProgramAttachedUniform> = new Map(); // TODO Could have duplicate uniform names in different shaders
    private attachedAttributes: Map<string, ProgramAttachedAttribute> = new Map();
    private attachedObjects: Map<string, ModelObject> = new Map();

    // private textures: Map<Number, Texture> = new Map();

    constructor(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string) {
        this.gl = gl;
        this.vertexShader = new Shader(gl, ShaderMap, vertexShader);
        this.fragmentShader = new Shader(gl, ShaderMap, fragmentShader);
        this.program = gl.createProgram();

        this.vertexShader.attachShader(this.program);
        this.fragmentShader.attachShader(this.program);

        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(this.program));
        }

        for (let [name, attribute] of this.vertexShader.getAttributes()) {
            this.attachedAttributes.set(name, new ProgramAttachedAttribute(gl, this.program, attribute));
        }

        for (let [name, uniform] of this.fragmentShader.getUniforms()) {
            this.attachedUniforms.set(name, new ProgramAttachedUniform(gl, this.program, uniform));
        }

        for (let [name, uniform] of this.vertexShader.getUniforms()) {
            this.attachedUniforms.set(name, new ProgramAttachedUniform(gl, this.program, uniform));
        }

    }

    use() {
        this.gl.useProgram(this.program);
    }

    getProgram() {
        return this.program;
    }

    setUniform(name: string, ...args: any[]) {
        let uniform = this.attachedUniforms.get(name);
        if (uniform) {
            uniform.setUniform(...args);
        } else {
            console.error(`Uniform ${name} not found in program`);
        }

    }

    loadTexture(textureMap: TextureMap, texture: Texture) {
        textureMap.loadTexture(texture);
        textureMap.assign(this.program, texture);
    }

    setAttribute(name: string, data: any, normalized: boolean) {
        let attribute = this.attachedAttributes.get(name);
        if (attribute) {
            attribute.setAttribute(data, normalized);
        } else {
            console.error(`Attribute ${name} not found in program`);
        }
    }

    setObject(name: string, object: Object3D) {
        this.attachedObjects.set(name, object);
    }

    getObject(name: string) {
        let object = this.attachedObjects.get(name);
        if (object) {
            return object.getBuffer();
        } else {
            console.error(`Object ${name} not found in program`);
            return null;
        }
    }

    drawObject(name: string) {
        let object = this.attachedObjects.get(name);
        if (object) {
            object.draw();
        } else {
            console.error(`Object ${name} not found in program`);
        }
    }

}

export function planetProgram(
    gl: WebGL2RenderingContext,
    textureMap: TextureMap,
    planetTextureUrl: string,
    cloudTextureUrl: string,
    planetColor: utils.Color,
    cloudColor: utils.Color,
    cloudRotation: number,
    subdivisions: number,
    radius: number
) {

    let program = new ShaderProgram(gl, 'planet.vert', 'planet.frag'); // TODO create function variable
    program.use();

    // Create sphere geometry
    let planet = new SphereObject(gl, radius, subdivisions);
    program.setObject('planet', planet);
    program.setAttribute('aPosition', planet.getPositions(), false);
    program.setAttribute('aTexCoord', planet.getTexCoords(), false);

    program.loadTexture(textureMap, new Texture(gl, 'uTexturePlanet', planetTextureUrl));
    program.loadTexture(textureMap, new Texture(gl, 'uTextureCloud', cloudTextureUrl));

    program.setUniform('uPlanetColor', planetColor.get_normalized_rgba());
    program.setUniform('uCloudRotation', cloudRotation * Math.PI / 180);
    program.setUniform('uCloudColor', cloudColor.get_normalized_rgba());


    return program;

    // Add lighting later in a different program

    // let lightPositionLocation = gl.getUniformLocation(program, 'uLightPosition');
    // let lightDirectionLocation = gl.getUniformLocation(program, 'uLightDirection');
    // let lightInnerLocation = gl.getUniformLocation(program, 'uLightInnerCutoff');
    // let lightOuterLocation = gl.getUniformLocation(program, 'uLightOuterCutoff');

    // gl.uniform3fv(lightPositionLocation, lightPosition);        // Example light position
    // gl.uniform3fv(lightDirectionLocation, [0.0, 0.0, 1.0]);       // Example direction
    // gl.uniform1f(lightInnerLocation, utils.radians(40.0));         // Inner cone angle in radians
    // gl.uniform1f(lightOuterLocation, utils.radians(85.0));         // Outer cone angle in radians

    // let rotationLocation = gl.getUniformLocation(program, 'uRotation');

}

// export function atmosphereProgram(
//     gl: WebGL2RenderingContext,

// ) {
//     let program = createProgram(gl, importShader(gl, 'atmosphere.vert'), importShader(gl, 'atmosphere.frag'));
//     gl.useProgram(program);

//     let atmosphereRadius = 1.05; // Slightly larger than the planet
//     let atmosphereSphere = utils.createSphere(subdivisions, atmosphereRadius);

//     // Create buffers for the atmosphere sphere
//     let positionBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, atmosphereSphere.positions, gl.STATIC_DRAW);

//     let indexBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
//     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, atmosphereSphere.indices, gl.STATIC_DRAW);

//     // let lightPositionLocation = gl.getUniformLocation(atmosphereProgram, 'uLightPosition');
//     let planetCenterLocation = gl.getUniformLocation(program, 'uPlanetCenter');
//     let atmosphereColorLocation = gl.getUniformLocation(program, 'uAtmosphereColor');
//     let atmosphereRadiusLocation = gl.getUniformLocation(program, 'uAtmosphereRadius');
//     let planetRadiusLocation = gl.getUniformLocation(program, 'uPlanetRadius');

//     // gl.uniform3fv(lightPositionLocation, lightPosition);
//     gl.uniform3fv(planetCenterLocation, [0.0, 0.0, 0.0]); // Assuming planet is at origin
//     gl.uniform3fv(atmosphereColorLocation, [0.4, 0.7, 1.0]); // Light blue atmosphere
//     gl.uniform1f(atmosphereRadiusLocation, atmosphereRadius);
//     gl.uniform1f(planetRadiusLocation, radius);

//     gl.useProgram(current_program);

//     return {
//         program: program,
//         positionBuffer: positionBuffer,
//         indexBuffer: indexBuffer,
//         // lightPositionLocation,
//         planetCenterLocation,
//         atmosphereColorLocation,
//         atmosphereRadiusLocation,
//         planetRadiusLocation,
//         atmosphereSphere,
//         atmosphereRadius,
//     };
// }

export function backgroundProgram(
    gl: globalThis.WebGL2RenderingContext, 
    textureMap: TextureMap,
    textureBackgroundUrl: string
) {

    let program = new ShaderProgram(gl, 'background.vert', 'background.frag'); // TODO create function variable
    program.use();

    let quadVertices = new Float32Array([
        // x, y,   u, v
       -1, -1,   0, 0,
        1, -1,   1, 0,
       -1,  1,   0, 1,
        1,  1,   1, 1,
    ]);

    // program.setObject('background', new ModelObject(gl, {indices: quadVertices}));
    program.setAttribute('aPosition', quadVertices, false);
    program.setAttribute('aTexCoord', quadVertices, false);

    program.loadTexture(textureMap, new Texture(gl, 'uTextureBackground', textureBackgroundUrl));


    // const bgVBO = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, bgVBO);
    // gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    return program;
}

export function drawBackground(gl: WebGL2RenderingContext, program: ShaderProgram) {

    program.use();

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND)
    gl.depthMask(false);

    // program.setAttribute('aPositionLocation', 0, false);
    // program.setAttribute('aTexCoordLocation', 1, false);


    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // gl.bindBuffer(gl.ARRAY_BUFFER, bgProg.positionBuffer);
    // gl.vertexAttribPointer(bgProg.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(bgProg.positionAttributeLocation);

    // gl.bindBuffer(gl.ARRAY_BUFFER, bgProg.texCoordBuffer);
    // gl.vertexAttribPointer(bgProg.texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(bgProg.texCoordAttributeLocation);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND)
    gl.depthMask(true);


}