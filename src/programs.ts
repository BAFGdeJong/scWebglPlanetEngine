import * as utils from './utils.js';
import { importShader } from './shaders.ts';
import { TextureMap, Texture } from './textures.ts';

class ShaderUniform {

    // TODO Cleanup garbage code.

    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private name: string;
    private location: WebGLUniformLocation | null = null;

    constructor(gl: WebGL2RenderingContext, program: WebGLProgram, name: string) {
        this.gl = gl;
        this.program = program;
        this.name = name;
        this.location = this.getUniformLocation(name);
    }

    getName() {
        return this.name;
    }

    createUniform(
        uniformFunc: (location: WebGLUniformLocation, data: any) => void,
        name: string,
        data: any
    ){
        let location = this.getUniformLocation(name);
        this.setUniform(uniformFunc, location!, data);
    }

    private getUniformLocation(name: string): WebGLUniformLocation | null {

        let location = this.gl.getUniformLocation(this.program, name);

        if (!location) {

            console.error(`Uniform location not found for ${name}`);
            return null;

        }

        return location;

    }

    private setUniform(
        uniformFunc: (location: WebGLUniformLocation, data: any) => void,
        location: WebGLUniformLocation,
        data: any
    ){

        uniformFunc.call(this.gl, location, data);

    }
}

class ShaderAttribute {

    // TODO Cleanup garbage code.

    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private name: string;
    private location: number | null = null;
    private buffer: WebGLBuffer | null = null;

    constructor(
        gl: WebGL2RenderingContext, 
        program: WebGLProgram, 
        name: string,
        data: any,
        dataSize: number,
        type: number,
        normalized: boolean,
        stride: number,
        offset: number
    ) {
        this.gl = gl;
        this.program = program;
        this.name = name;
        this.location, this.buffer = this.createAttribute(name, data, dataSize, type, normalized, stride, offset);
    }

    getName() {
        return this.name;
    }

    setBuffer(data: any) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    createAttribute(name: string, data: any, dataSize: number, type: number, normalized: boolean, stride: number, offset: number) {

        let buffer = this.createBuffer(data);
        let loc = this.setupAttribute(name);

        this.gl.vertexAttribPointer(loc, dataSize, type, normalized, stride, offset);

        return {
            buffer: buffer,
            location: loc
        }

    }

    private createBuffer(data: any) {

        let buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

        return buffer;

    }

    private getAttributeLocation(name: string): number {

        let location = this.gl.getAttribLocation(this.program, name);
        
        if (location === -1) {

            console.error(`Attribute location not found for ${name}`);

        }

        return location;

    }

    private enableAttribute(location: number) {
        this.gl.enableVertexAttribArray(location);
    }

    private setupAttribute(name: string): number {
        let location = this.getAttributeLocation(name);
        this.enableAttribute(location);
        return location;
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
    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;
    private uniforms: Map<string, ShaderUniform> = new Map();
    private attributes: Map<string, ShaderAttribute> = new Map();
    private textures: Map<Number, Texture> = new Map();

    constructor(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string) {
        this.gl = gl;
        this.vertexShader = importShader(gl, vertexShader);
        this.fragmentShader = importShader(gl, fragmentShader);
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(this.program));
        }

    }

    use() {
        this.gl.useProgram(this.program);
    }

    getProgram() {
        return this.program;
    }

    // addAttribute(ShaderAttribute: ShaderAttribute) {
    //     this.attributes.set(ShaderAttribute.getName(), ShaderAttribute);
    // }

    getAttributes() {
        return this.attributes;
    }

    createAttribute(name: string, data: any, dataSize: number, type: number, normalized: boolean, stride: number, offset: number) {
        this.use();
        let sa = new ShaderAttribute(this.gl, this.program, name, data, dataSize, type, normalized, stride, offset);
        this.attributes.set(sa.getName(), sa);
    }

    updateAttribute(name: string, data: any) {
        this.use();
        let sa = this.attributes.get(name);
        sa?.setBuffer(data); // TODO Error handling
    }

    getUniforms() {
        return this.uniforms;
    }

    getTextures() {
        return this.textures;
    }

    addTexture(textureMap: TextureMap, texture: Texture) {
        this.use();
        textureMap.loadTexture(texture);
        textureMap.assign(this.program, texture);
        this.textures.set(texture.getId(), texture);
    }

    createUniform(
        uniformFunc: (location: WebGLUniformLocation, data: any) => void,
        name: string,
        data: any
    ) {
        this.use();
        let su = new ShaderUniform(this.gl, this.program, name);
        su.createUniform(uniformFunc, name, data);
        this.uniforms.set(su.getName(), su);
    }

    updateUniform(
        uniformFunc: (location: WebGLUniformLocation, data: any) => void,
        name: string,
        data: any
    ) {
        this.use();
        let su = this.uniforms.get(name);
        su?.createUniform(uniformFunc, name, data); // TODO Error handling
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

    program.createAttribute(
        'aPosition',
        sphere.positions,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );

    program.createAttribute(
        'aTexCoord',
        sphere.texCoords,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    let planetTexture = new Texture(gl, 'uTexturePlanet', planetTextureUrl);
    program.addTexture(textureMap, planetTexture);
    // textureMap.loadTexture(planetTexture);
    // textureMap.assign(program.getProgram(), planetTexture);

    let cloudTexture = new Texture(gl, 'uTextureCloud', cloudTextureUrl);
    program.addTexture(textureMap, cloudTexture);
    // textureMap.loadTexture(cloudTexture);
    // textureMap.assign(program.getProgram(), cloudTexture);

    program.createUniform(
        gl.uniform4fv,
        'uPlanetColor',
        planetColor.get_normalized_rgba()
    );

    program.createUniform(
        gl.uniform1f,
        'uCloudRotation',
        cloudRotation * Math.PI / 180
    );

    program.createUniform(
        gl.uniform4fv,
        'uCloudColor',
        cloudColor.get_normalized_rgba()
    );

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