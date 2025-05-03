'use strict';

import * as utils from './utils.ts';
import { Color } from './utils.ts';
import { ShaderManager } from './shadermanager.ts';
import { SphereObject, BackgroundObject } from './objectstorage.ts';
import { TextureLoader } from './textureloader.ts';

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

    let shaderManager = new ShaderManager(gl);

    shaderManager.createShaderPackage('planet', ShaderMap['planet.vert'], ShaderMap['planet.frag']);
    shaderManager.createShaderPackage('background', ShaderMap['background.vert'], ShaderMap['background.frag']);
    shaderManager.createProgram('planet', 'planet');
    shaderManager.createProgram('background', 'background');

    let textureLoader = new TextureLoader(gl);
    let planetTexture = textureLoader.load(texturePlanetUrl);
    let cloudsTexture = textureLoader.load(textureCloudUrl);
    let backGroundTexture = textureLoader.load(textureBackgroundUrl);

    function clearCanvas(gl: WebGL2RenderingContext) {
        // Clear the canvas and depth buffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    const camera = {
        position: [0, 0, cameraDistance], // Camera positioned along the negative Z-axis
        rotation: [0, 0, 0]   // No initial rotation
    };


    // const totalProjectionMatrixLocation = gl.getUniformLocation(planetShaderProgram.getProgram(), 'uTotalProjectionMatrix');
    // const modelMatrixLocation = gl.getUniformLocation(planetShaderProgram.getProgram(), 'uModelMatrix');

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for glow
    gl.enable(gl.CULL_FACE);

    // Add time uniform to the render loop
    let startTime = performance.now();

    let initMatrix = utils.createMat4();

    // const sphereTranslationLocation = gl.getUniformLocation(program.program, 'uSphereTranslation');
    // let sphereTranslation = [0.0, 0.0, 0.0]; // Initial position
    let fov = Math.PI * 0.25

    let background = new BackgroundObject(gl, shaderManager);
    let sphere = new SphereObject(gl, shaderManager, 1, 32);

    function render(gl: WebGL2RenderingContext) {

        clearCanvas(gl);

        background.setShaderProgram('background');
        background.setBuffers();
        shaderManager.assignTexture(gl.getUniformLocation(shaderManager.getProgram('background')!, 'uTextureBackground')!, backGroundTexture, 2);
        background.render();

        let currentTime = (performance.now() - startTime) / 1000;

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
        sphere.setShaderProgram('planet');
        sphere.setBuffers();
        let planetShader = shaderManager.getProgram('planet');
        gl.uniform1f(gl.getUniformLocation(planetShader!, 'uTime'), currentTime);
        gl.uniformMatrix4fv(gl.getUniformLocation(planetShader!, 'uModelMatrix'), false, modelMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(planetShader!, 'uTotalProjectionMatrix'), false, pv);
        gl.uniform1f(shaderManager.getUniformLocation(planetShader!, 'uCloudRotation'), cloudRotation * Math.PI / 180);
        gl.uniform4fv(gl.getUniformLocation(planetShader!, 'uCloudColor'), cloudColor.get_normalized_rgba());
        gl.uniform4fv(gl.getUniformLocation(planetShader!, 'uPlanetColor'), planetColor.get_normalized_rgba());
        shaderManager.assignTexture(gl.getUniformLocation(shaderManager.getProgram('planet')!, 'uTexturePlanet')!, planetTexture, 0);
        shaderManager.assignTexture(gl.getUniformLocation(shaderManager.getProgram('planet')!, 'uTextureCloud')!, cloudsTexture, 1);
        sphere.render();

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
    rotation: 10.0,
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
    cloudRotation: 15.0,

    // Lighting information
    lightPosition: [0,1.0,0],

    // Planet geometry information
    subdivisions: 32,
    radius: 1.0,

    // Camera information
    cameraDistance: 3,

}); // Compression wip

