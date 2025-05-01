'use strict';

import * as utils from './utils.ts';
import { Color } from './utils.ts';
import { planetProgram, ShaderProgram } from './programs.ts';
import { TextureMap, Texture } from './textures.ts';


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

    let textureMap = new TextureMap();

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

    let planetShaderProgram = planetProgram(
        gl,
        textureMap,
        texturePlanetUrl,
        textureCloudUrl,
        planetColor,
        cloudColor,
        cloudRotation,
        subdivisions,
        radius,
    );

    console.log(planetShaderProgram);

    // const totalProjectionMatrixLocation = gl.getUniformLocation(planetShaderProgram.getProgram(), 'uTotalProjectionMatrix');
    // const modelMatrixLocation = gl.getUniformLocation(planetShaderProgram.getProgram(), 'uModelMatrix');

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for glow
    gl.enable(gl.CULL_FACE);

    // Add time uniform to the render loop
    let startTime = performance.now();

    let initMatrix = utils.createMat4();

    planetShaderProgram.program.createUniform((location: any, data: any) => gl.uniformMatrix4fv(location, false, data), 'uTotalProjectionMatrix', initMatrix);
    planetShaderProgram.program.createUniform((location: any, data: any) => gl.uniformMatrix4fv(location, false, data), 'uModelMatrix', initMatrix);
    planetShaderProgram.program.createUniform(gl.uniform1f, 'uTime', startTime);

    // const sphereTranslationLocation = gl.getUniformLocation(program.program, 'uSphereTranslation');
    // let sphereTranslation = [0.0, 0.0, 0.0]; // Initial position
    let fov = Math.PI * 0.25

    // function tick(time: number) {
    //     render(gl, time);
    //     requestAnimationFrame(tick);
    // }

    function render(gl: WebGL2RenderingContext) {

        clearCanvas(gl);

        // drawBackground(gl, program.program, bgProgram);

        let currentTime = (performance.now() - startTime) / 1000;
        planetShaderProgram.program.updateUniform(gl.uniform1f, 'uTime', currentTime);

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
        planetShaderProgram.program.updateUniform((location: any, data: any) => gl.uniformMatrix4fv(location, false, data), 'uModelMatrix', modelMatrix);
    
        // Set the total projection matrix (projection * view)
        planetShaderProgram.program.createUniform((location: any, data: any) => gl.uniformMatrix4fv(location, false, data), 'uTotalProjectionMatrix', pv);
    
        console.log(planetShaderProgram.program.getUniforms());
        console.log(planetShaderProgram.program.getAttributes());
        console.log(planetShaderProgram.program.getTextures());

        // Bind the index buffer and draw the sphere
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planetShaderProgram.indexBuffer!);
        gl.drawElements(gl.TRIANGLES, planetShaderProgram.sphere.indices.length, gl.UNSIGNED_SHORT, 0);

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

