'use strict';

import * as utils from './utils.ts';
import { importShader } from './shaders.ts';

class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b:number, a:number=0.0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    get_normalized_rgba() {
        return [this.r / 255, this.g / 255, this.b / 255, this.a / 255];
    }

    get_rgba() {
        return [this.r, this.g, this.b, this.a];
    }

    get_normalized_rgb() {
        return [this.r / 255, this.g / 255, this.b / 255];
    }

    get_rgb() {
        return [this.r, this.g, this.b];
    }

}

function planetEngine({
    texturePlanetUrl = 'null',
    texturePlanetIsCompressed = false,
    textureCloudUrl = 'null',
    textureCloudIsCompressed = false,
    textureBackgroundUrl = 'null',
    textureBackgroundIsCompressed = false,
    textureAtmosphereUrl = 'null',
    textureAtmosphereIsCompressed = false,
    textureGlowUrl = 'null',
    textureGlowIsCompressed = false,

    // Planet rotation information
    rotation = 0.0,
    tilt = 0.0,
    pitch = 0.0,

    // Planet color information
    planetColor = new Color(0.0, 0.0, 0.0, 1.0),

    // Planet atmosphere information
    atmosphereColor = new Color(0.0, 0.0, 0.0, 1.0),
    atmosphereThickness = 0.0,
    atmosphereThicknessMin = 0.0,   

    // Planet clouds information
    cloudColor = new Color(0.0, 0.0, 0.0, 0.0),
    cloudRotation = 0.0,

    // Light information
    lightPosition = [0.0, 0.0, 1.0],

    // Planet geometry information
    subdivisions = 28, 
    radius = 1,

    // Camera information
    cameraDistance = 1.0,

    // textureCloudsUrl,
    // sunColor,
    // sunSize,
    // sunPosition,
    // sunIntensity,
    // sunDistance,

}) {

    // Minimal rendering setup for createSphere
    let canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    document.body.appendChild(canvas);

    let gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) {
        console.error('WebGL2 not supported');
    }

    gl = gl!

    gl.viewport(0, 0, canvas.width, canvas.height);

    //wip

    // if (texturePlanetIsCompressed) {
    //     const ext = gl.getExtension('WEBGL_compressed_texture_s3tc');
    //     const texture = loadTexture(gl, texturePlanetUrl);
    //     gl.activeTexture(gl.TEXTURE0);
    //     gl.bindTexture(gl.TEXTURE_2D, texture);
    //     const textureLocation = gl.getUniformLocation(program, 'uTexture');
    //     gl.uniform1i(textureLocation, 0);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    //     gl.texImage2D(gl.TEXTURE_2D, 0, ext.COMPRESSED_RGBA_S3TC_DXT1_EXT, 1, 1, 0, ext.COMPRESSED_RGBA_S3TC_DXT1_EXT, ext.UNSIGNED_BYTE, null);
    // }

    // Bind the clouds texture


    // Bind and setup atmosphere texture
    // const atmosphereTexture = loadTexture(gl, textureAtmosphereUrl);
    // gl.activeTexture(gl.TEXTURE2);
    // gl.bindTexture(gl.TEXTURE_2D, atmosphereTexture);

    // Bind and setup lighting

    function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {

        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
        }

        return program;
    }

    function planetProgram(gl: WebGL2RenderingContext) {
        let program = createProgram(gl, importShader(gl, 'planet.vert'), importShader(gl, 'planet.frag'));
        gl.useProgram(program);

        // Create sphere geometry
        let sphere = utils.createSphere(subdivisions, radius);

        // Create buffers
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);

        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

        // Update attribute for texture coordinates
        let texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sphere.texCoords, gl.STATIC_DRAW);

        // Set up attribute
        let positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        // Set up attribute for texture coordinates
        let texCoordAttributeLocation = gl.getAttribLocation(program, 'aTexCoord');
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        let texture = utils.loadTexture(gl, program, 'uTexture', texturePlanetUrl, 0);
        utils.assignTexture(gl, texture.id, texture.location!); // TODO error handling
        let planetColorLocation = gl.getUniformLocation(program, 'uPlanetColor');
        gl.uniform4fv(planetColorLocation, planetColor.get_normalized_rgba());

        let textureCloud = utils.loadTexture(gl, program, 'uTextureCloud', textureCloudUrl, 1);
        utils.assignTexture(gl, textureCloud.id, textureCloud.location!); // TODO error handling
        let cloudRotationLocation = gl.getUniformLocation(program, 'uCloudRotation');
        gl.uniform1f(cloudRotationLocation, cloudRotation * Math.PI / 180);
        let cloudColorLocation = gl.getUniformLocation(program, 'uCloudColor');
        gl.uniform4fv(cloudColorLocation, cloudColor.get_normalized_rgba());

        let lightPositionLocation = gl.getUniformLocation(program, 'uLightPosition');
        let lightDirectionLocation = gl.getUniformLocation(program, 'uLightDirection');
        let lightInnerLocation = gl.getUniformLocation(program, 'uLightInnerCutoff');
        let lightOuterLocation = gl.getUniformLocation(program, 'uLightOuterCutoff');

        gl.uniform3fv(lightPositionLocation, lightPosition);        // Example light position
        gl.uniform3fv(lightDirectionLocation, [0.0, 0.0, 1.0]);       // Example direction
        gl.uniform1f(lightInnerLocation, utils.radians(40.0));         // Inner cone angle in radians
        gl.uniform1f(lightOuterLocation, utils.radians(85.0));         // Outer cone angle in radians

        let rotationLocation = gl.getUniformLocation(program, 'uRotation');

        return {
            program: program,
            sphere: sphere,
            positionBuffer: positionBuffer,
            indexBuffer: indexBuffer,
            positionAttributeLocation: positionAttributeLocation,
            texCoordAttributeLocation: texCoordAttributeLocation,
            texture: texture,
            textureCloud: textureCloud,
            planetColorLocation: planetColorLocation,
            cloudRotationLocation: cloudRotationLocation,
            cloudColorLocation: cloudColorLocation,
            lightPositionLocation: lightPositionLocation,
            lightDirectionLocation: lightDirectionLocation,
            lightInnerLocation: lightInnerLocation,
            lightOuterLocation: lightOuterLocation,
            rotationLocation: rotationLocation,
        }

    }

    function atmosphereProgram(gl: any, current_program: any) {
        let program = createProgram(gl, importShader(gl, 'atmosphere.vert'), importShader(gl, 'atmosphere.frag'));
        gl.useProgram(program);

        let atmosphereRadius = 1.05; // Slightly larger than the planet
        let atmosphereSphere = utils.createSphere(subdivisions, atmosphereRadius);
    
        // Create buffers for the atmosphere sphere
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, atmosphereSphere.positions, gl.STATIC_DRAW);
    
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, atmosphereSphere.indices, gl.STATIC_DRAW);
    
        // let lightPositionLocation = gl.getUniformLocation(atmosphereProgram, 'uLightPosition');
        let planetCenterLocation = gl.getUniformLocation(program, 'uPlanetCenter');
        let atmosphereColorLocation = gl.getUniformLocation(program, 'uAtmosphereColor');
        let atmosphereRadiusLocation = gl.getUniformLocation(program, 'uAtmosphereRadius');
        let planetRadiusLocation = gl.getUniformLocation(program, 'uPlanetRadius');
    
        // gl.uniform3fv(lightPositionLocation, lightPosition);
        gl.uniform3fv(planetCenterLocation, [0.0, 0.0, 0.0]); // Assuming planet is at origin
        gl.uniform3fv(atmosphereColorLocation, [0.4, 0.7, 1.0]); // Light blue atmosphere
        gl.uniform1f(atmosphereRadiusLocation, atmosphereRadius);
        gl.uniform1f(planetRadiusLocation, radius);
    
        gl.useProgram(current_program);
    
        return {
            program: program,
            positionBuffer: positionBuffer,
            indexBuffer: indexBuffer,
            // lightPositionLocation,
            planetCenterLocation,
            atmosphereColorLocation,
            atmosphereRadiusLocation,
            planetRadiusLocation,
            atmosphereSphere,
            atmosphereRadius,
        };
    }

    function backgroundProgram(gl: any, current_program: any) {
        const quadVertices = new Float32Array([
            // x, y,   u, v
            -1, -1,   0, 0,
             1, -1,   1, 0,
            -1,  1,   0, 1,
             1,  1,   1, 1,
        ]);

        const bgVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bgVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

        const bgVertexShader = importShader(gl, 'background.vert');
        const bgFragmentShader = importShader(gl, 'background.frag');
        const bgProgram = gl.createProgram();
        gl.attachShader(bgProgram, bgVertexShader);
        gl.attachShader(bgProgram, bgFragmentShader);
        gl.linkProgram(bgProgram);

        if (!gl.getProgramParameter(bgProgram, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(bgProgram);
            throw `Could not compile WebGL program. \n\n${info}`;
        }

        gl.useProgram(bgProgram);

        let aBackPositionLocation = gl.getAttribLocation(bgProgram, "aPosition");
        let aBackTexCoordLocation = gl.getAttribLocation(bgProgram, "aTexCoord");

        let backgroundTexture = utils.loadTexture(gl, bgProgram, 'uTexture', textureBackgroundUrl, 14);
        utils.assignTexture(gl, backgroundTexture.id, backgroundTexture.location!); // TODO error handling

        gl.useProgram(current_program);

        return {
            program: bgProgram,
            bgVertexBuffer: bgVBO,
            backgroundTexture: backgroundTexture,
            aPositionLocation: aBackPositionLocation,
            aTexCoordLocation: aBackTexCoordLocation
          };
    }

    let program = planetProgram(gl);
    // let atmosphereProg = atmosphereProgram(gl, program.program, atmosphereFragmentShaderSource, atmosphereVertexShaderSource);
    // let bgProgram = backgroundProgram(gl, program.program);

    // function drawBackground(gl: any, current_program: any, bgProg: any) {
    //     gl.disable(gl.DEPTH_TEST);
    //     gl.disable(gl.BLEND)
    //     gl.depthMask(false);

    //     gl.useProgram(bgProg.program);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, bgProg.bgVertexBuffer);
    //     gl.vertexAttribPointer(bgProg.aPositionLocation, 2, gl.FLOAT, false, 16, 0);
    //     gl.enableVertexAttribArray(bgProg.aPositionLocation);
    //     gl.vertexAttribPointer(bgProg.aTexCoordLocation, 2, gl.FLOAT, false, 16, 8);
    //     gl.enableVertexAttribArray(bgProg.aTexCoordLocation);

    //     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    //     gl.useProgram(current_program);
    //     gl.enable(gl.DEPTH_TEST);
    //     gl.depthMask(true);
    //     gl.enable(gl.BLEND);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, bgProg.positionBuffer);
    //     gl.vertexAttribPointer(bgProg.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(bgProg.positionAttributeLocation);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, bgProg.texCoordBuffer);
    //     gl.vertexAttribPointer(bgProg.texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(bgProg.texCoordAttributeLocation);

    // }

    function clearCanvas(gl: WebGL2RenderingContext) {
        // Clear the canvas and depth buffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    const camera = {
        position: [0, 0, cameraDistance], // Camera positioned along the negative Z-axis
        rotation: [0, 0, 0]   // No initial rotation
    };

    // Set up uniform
    const totalProjectionMatrixLocation = gl.getUniformLocation(program.program, 'uTotalProjectionMatrix');
    const modelMatrixLocation = gl.getUniformLocation(program.program, 'uModelMatrix');

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for glow
    gl.enable(gl.CULL_FACE);

    // Add time uniform to the render loop
    const timeLocation = gl.getUniformLocation(program.program, 'uTime');
    let startTime = performance.now();

    const sphereTranslationLocation = gl.getUniformLocation(program.program, 'uSphereTranslation');
    let sphereTranslation = [0.0, 0.0, 0.0]; // Initial position
    let fov = Math.PI * 0.25

    // function tick(time: number) {
    //     render(gl, time);
    //     requestAnimationFrame(tick);
    // }

    function render(gl: WebGL2RenderingContext) {

        clearCanvas(gl);

        // drawBackground(gl, program.program, bgProgram);

        let currentTime = (performance.now() - startTime) / 1000;
        gl.uniform1f(timeLocation, currentTime);

        // May want to modify canvas dimensions later, thus is in render loop.
        let projectionMatrix = utils.createMat4();
        utils.perspective(projectionMatrix, fov, canvas.width / canvas.height, 0.00001, 100);
        
        let viewMatrix = utils.createMat4();
        utils.lookAt(viewMatrix, camera.position, [0, 0, 0], [0, 1, 0]);

        let pv = utils.createMat4();
        utils.multiply(pv, projectionMatrix, viewMatrix);
    
        let modelMatrix = utils.createMat4();

        // Create individual rotation matrices
        let rotationZ = utils.createMat4();
        let rotationY = utils.createMat4();
        let rotationX = utils.createMat4();
        
        utils.rotateZ(rotationZ, rotationZ, tilt * utils.rads); // Apply tilt
        
        utils.rotateY(rotationY, rotationY, currentTime * ((rotation * utils.rads) * 0.7)); // Spin
        utils.rotateX(rotationX, rotationX, pitch * utils.rads); // Optional pitch
        
        // Combine rotations
        let tempMatrix = utils.createMat4();
        utils.multiply(tempMatrix, rotationZ, rotationY);     // First tilt, then spin around tilted Y
        utils.multiply(modelMatrix, tempMatrix, rotationX);   // Then pitch around X if needed

        // translate(modelMatrix, modelMatrix, [0, 0, 0]);

        // Set the final model matrix for the planet (including rotation and translation)
        gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    
        // Set the total projection matrix (projection * view)
        gl.uniformMatrix4fv(totalProjectionMatrixLocation, false, pv);
    
        // Bind the index buffer and draw the sphere
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.indexBuffer);
        gl.drawElements(gl.TRIANGLES, program.sphere.indices.length, gl.UNSIGNED_SHORT, 0);

        // // Use the atmosphere shader program
        // gl.useProgram(atmosphereProg.program);

        // // Set atmosphere-specific uniforms
        // // gl.uniform3fv(atmosphereProg.lightPositionLocation, lightPosition);
        // gl.uniform3fv(atmosphereProg.planetCenterLocation, [0.0, 0.0, 0.0]); // Assuming planet is at origin
        // gl.uniform3fv(atmosphereProg.atmosphereColorLocation, atmosphereColor.get_normalized_rgb());
        // gl.uniform1f(atmosphereProg.atmosphereRadiusLocation, 1.2); // Slightly larger than the planet
        // gl.uniform1f(atmosphereProg.planetRadiusLocation, radius);
        // gl.uniform3fv(sphereTranslationLocation, sphereTranslation); // Set the translation for the atmosphere

        // // Bind the atmosphere sphere buffers
        // gl.bindBuffer(gl.ARRAY_BUFFER, atmosphereProg.positionBuffer);
        // gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(positionAttributeLocation);

        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, atmosphereProg.indexBuffer);

        // // Render the atmosphere sphere
        // gl.drawElements(gl.TRIANGLES, atmosphereProg.atmosphereSphere.indices.length, gl.UNSIGNED_SHORT, 0);

        // Continue rendering
        requestAnimationFrame(render.bind(null, gl));
    }
    render(gl);
}

planetEngine({
    // Planet texturing information
    texturePlanetUrl: '/textures/arid.jpg',
    texturePlanetIsCompressed: false,
    textureCloudUrl: '/textures/clouds_banded01.png',
    textureCloudIsCompressed: false,
    textureBackgroundUrl: '/textures/background2.jpg',
    textureBackgroundIsCompressed: false,
    textureAtmosphereUrl: '',
    textureAtmosphereIsCompressed: false,
    textureGlowUrl: '',
    textureGlowIsCompressed: false,

    // Planet rotation information
    rotation: 0.0,
    tilt: 30.0, // Degrees
    pitch: 45.0, // Degrees

    // Planet color information
    planetColor: new Color(255,255,255,255),

    // Planet atmosphere information
    atmosphereColor: new Color(0, 0, 0, 0),
    atmosphereThickness: 0.0,
    atmosphereThicknessMin: 0.0,

    // Planet clouds information
    cloudColor: new Color(235,240,250,225),
    cloudRotation: 5.0,

    // Lighting information
    lightPosition: [0,1.0,0],

    // Planet geometry information
    subdivisions: 32,
    radius: 1.0,

    // Camera information
    cameraDistance: 3,

}); // Compression wip
