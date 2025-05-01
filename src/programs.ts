import * as utils from './utils.js';
import { ShaderMap, Shader, Uniform, Attribute} from './shaders.ts';
import { TextureMap, Texture } from './textures.ts';

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

    let program = new ShaderProgram(gl, 'planet.vert', 'planet.frag');
    program.use();

    // Create sphere geometry
    let sphere = utils.createSphere(subdivisions, radius);
    program.setAttribute('aPosition', sphere.positions, false);
    program.setAttribute('aTexCoord', sphere.texCoords, false);

    program.loadTexture(textureMap, new Texture(gl, 'uTexturePlanet', planetTextureUrl));
    program.loadTexture(textureMap, new Texture(gl, 'uTextureCloud', cloudTextureUrl));

    program.setUniform('uPlanetColor', planetColor.get_normalized_rgba());
    program.setUniform('uCloudRotation', cloudRotation * Math.PI / 180);
    program.setUniform('uCloudColor', cloudColor.get_normalized_rgba());

    // let lightPositionLocation = gl.getUniformLocation(program, 'uLightPosition');
    // let lightDirectionLocation = gl.getUniformLocation(program, 'uLightDirection');
    // let lightInnerLocation = gl.getUniformLocation(program, 'uLightInnerCutoff');
    // let lightOuterLocation = gl.getUniformLocation(program, 'uLightOuterCutoff');

    // gl.uniform3fv(lightPositionLocation, lightPosition);        // Example light position
    // gl.uniform3fv(lightDirectionLocation, [0.0, 0.0, 1.0]);       // Example direction
    // gl.uniform1f(lightInnerLocation, utils.radians(40.0));         // Inner cone angle in radians
    // gl.uniform1f(lightOuterLocation, utils.radians(85.0));         // Outer cone angle in radians

    // let rotationLocation = gl.getUniformLocation(program, 'uRotation');

    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

    return { program, sphere, indexBuffer };

}

// function atmosphereProgram(gl: any, current_program: any) {
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

// function backgroundProgram(gl: any, current_program: any) {
//     const quadVertices = new Float32Array([
//         // x, y,   u, v
//         -1, -1,   0, 0,
//             1, -1,   1, 0,
//         -1,  1,   0, 1,
//             1,  1,   1, 1,
//     ]);

//     const bgVBO = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, bgVBO);
//     gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

//     const bgVertexShader = importShader(gl, 'background.vert');
//     const bgFragmentShader = importShader(gl, 'background.frag');
//     const bgProgram = gl.createProgram();
//     gl.attachShader(bgProgram, bgVertexShader);
//     gl.attachShader(bgProgram, bgFragmentShader);
//     gl.linkProgram(bgProgram);

//     if (!gl.getProgramParameter(bgProgram, gl.LINK_STATUS)) {
//         const info = gl.getProgramInfoLog(bgProgram);
//         throw `Could not compile WebGL program. \n\n${info}`;
//     }

//     gl.useProgram(bgProgram);

//     let aBackPositionLocation = gl.getAttribLocation(bgProgram, "aPosition");
//     let aBackTexCoordLocation = gl.getAttribLocation(bgProgram, "aTexCoord");

//     let backgroundTexture = utils.loadTexture(gl, bgProgram, 'uTexture', textureBackgroundUrl, 14);
//     utils.assignTexture(gl, backgroundTexture.id, backgroundTexture.location!); // TODO error handling

//     gl.useProgram(current_program);

//     return {
//         program: bgProgram,
//         bgVertexBuffer: bgVBO,
//         backgroundTexture: backgroundTexture,
//         aPositionLocation: aBackPositionLocation,
//         aTexCoordLocation: aBackTexCoordLocation
//         };
// }