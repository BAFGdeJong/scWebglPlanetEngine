'use strict';

import * as utils from './utils.ts';
import { Color } from './utils.ts';
import { ShaderManager } from './shadermanager.ts';
import { SphereObject, BackgroundObject } from './objectstorage.ts';
import { TextureLoader } from './textureloader.ts';

// TODO glob deprecated
const shaderFiles = import.meta.glob('./shaders/*.{vert,frag}', { as: 'raw', eager: true });
// const shaderFiles = import.meta.glob('./shaders/*.{vert,frag}', { as: '?raw', eager: true }) as Record<string, string>; << Code doesn't work because it becomes a object.


// TODO this can be better, calculate before sending to wiki
export const ShaderMap: Record<string, string> = (() => {
    
    let tempShaderMap: Record<string, string> = {};

    for (let path in shaderFiles) {

        let fileName = path.split('/').pop()!;
        tempShaderMap[fileName] = shaderFiles[path];
    
    }

    return tempShaderMap;

})();

function planetEngine({
    // Meta data
    isStar = false,
    isBlackHole = false,
    isGasGiant = false,
    isNebulaCenter = false,
    isPulsar = false,
    isUseReverseLightForGlow = false,

    // Texture urls
    texturePlanetUrl = 'null',
    texturePlanetIsCompressed = false,
    textureCloudUrl = 'null',
    textureCloudIsCompressed = false,
    textureBackgroundUrl = 'null',
    textureBackgroundIsCompressed = false,
    textureCorona = 'null',
    textureCoronaIsCompressed = false,
    // textureAtmosphereUrl = 'null',
    // textureAtmosphereIsCompressed = false, Probably not used ingame anymore
    textureShieldUrl = 'null',
    textureShieldIsCompressed = false,
    textureGlowUrl = 'null',
    textureGlowIsCompressed = false,

    // Planet rotation information
    rotation = 0.0, // Float
    tilt = 0.0, // Float
    pitch = 0.0, // Float

    // Planet color information
    planetColor = new Color(0.0, 0.0, 0.0, 1.0), 

    // Planet atmosphere information
    atmosphereColor = new Color(0.0, 0.0, 0.0, 1.0),
    atmosphereThickness = 0.0,
    atmosphereThicknessMin = 0.0,

    // Planet clouds information
    cloudColor = new Color(0.0, 0.0, 0.0, 0.0),
    cloudRotation = 0.0,

    // Corona information
    coronaSize = 0, // Float
    coronaColor = new Color(0.0,0.0,0.0,0.0),

    // Shield information
    shieldColor = new Color(0.0,0.0,0.0,0.0),
    shieldThickness = 0.0, // Float

    // Light information
    lightPosition = [0.0, 0.0, 1.0],

    // Planet geometry information
    subdivisions = 28, 
    radius = 1,

    // Camera information
    cameraDistance = 1.0,

    // GL settings
    canvasWidth = 0,
    canvasHeight = 0,

    // // Missing

    // void addTag(String tag)
    
    // String getAOrAn()
 
    // String getDescriptionId()
 
    // Color getGlowColor()
 
    // Color getIconColor()
 
    // String getIconTexture()
 
    // String getName()
 
    // String getPlanetType()
 
    // float getScaleMultMapIcon()
 
    // float getScaleMultStarscapeIcon()
 
    // Color getShieldColor()
 
    // String getStarscapeIcon()
 
    // Set<String> getTags()
 
    // boolean isDoNotShowInCombat()
    
    // boolean isUseReverseLightForGlow()

}) {

    // Minimal rendering setup for createSphere
    let canvas = document.createElement('canvas');

    let gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) {
        console.error('WebGL2 not supported');
        return
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    document.body.appendChild(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);

    let shaderManager = new ShaderManager(gl);
    let textureLoader = new TextureLoader(gl);

    shaderManager.createShaderPackage('planet', ShaderMap['planet.vert'], ShaderMap['planet.frag']);
    shaderManager.createShaderPackage('background', ShaderMap['background.vert'], ShaderMap['background.frag']);
    shaderManager.createProgram('planet', 'planet');
    shaderManager.createProgram('background', 'background');

    let planetTexture = textureLoader.load(texturePlanetUrl);
    let cloudsTexture = textureLoader.load(textureCloudUrl);
    let backGroundTexture = textureLoader.load(textureBackgroundUrl);

    function clearCanvas(gl: WebGL2RenderingContext) {
        // Clear the canvas and depth buffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    function setGlSettings(gl: WebGL2RenderingContext) {
        // gl.enable(gl.DEPTH_TEST);
        // gl.depthMask(true);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for glow
        // gl.enable(gl.CULL_FACE);
    }

    function moveCamera() {

    }

    function getCurrentTime() { return performance.now(); }

    let camera = {
        position: [0, 0, cameraDistance],
        rotation: [0, 0, 0],
        radius: radius + cameraDistance,
        azimuth: 0,
        elevation: 0,
        speed: 0.02
    };

    let keysPressed: any = {};

    let isPlanetRotating = 1;

    window.addEventListener('keydown', (event: any) => {
        keysPressed[event.key] = true;
    });
    
    window.addEventListener('keyup', (event: any) => {
        keysPressed[event.key] = false;

        if (event.key === ' ' || event.key === 'Space') {
            if (isPlanetRotating) {
                isPlanetRotating = 0;
            } else {
                isPlanetRotating = 1;
            }
        }
    });
    
    function handleKeyboardInput() {
        if (keysPressed['a'] || keysPressed['A']) {
            camera.azimuth -= camera.speed;
        }
        if (keysPressed['d'] || keysPressed['D']) {
            camera.azimuth += camera.speed;
        }
        if (keysPressed['w'] || keysPressed['W']) {
            camera.elevation = Math.min(camera.elevation + camera.speed, Math.PI / 2 - 0.01);
        }
        if (keysPressed['s'] || keysPressed['S']) {
            camera.elevation = Math.max(camera.elevation - camera.speed, -Math.PI / 2 + 0.01);
        }
    }

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
    
        const zoomSpeed = 0.5;
        camera.radius += e.deltaY * 0.01 * zoomSpeed;
    
        // Clamp to prevent flipping through center or going too far
        camera.radius = Math.max(radius + 1, Math.min(camera.radius, 100));
    });

    // window.addEventListener('mousemove', onMouseMove);
    // window.addEventListener('mousedown', onMouseDown);
    // window.addEventListener('mouseup', onMouseUp);
    

    setGlSettings(gl);
    let startTime = getCurrentTime();
    let fov = Math.PI * 0.25;

    let background = new BackgroundObject(gl, shaderManager);
    let sphere = new SphereObject(gl, shaderManager, 1, 32, utils.createMat4());

    function render(gl: WebGL2RenderingContext) {

        clearCanvas(gl);

        handleKeyboardInput();

        background.setShaderProgram('background');
        background.setBuffers();
        shaderManager.assignTexture(gl.getUniformLocation(shaderManager.getProgram('background')!, 'uTextureBackground')!, backGroundTexture, 2);
        background.render();

        let currentTime = (performance.now() - startTime) / 1000;

        let projectionMatrix = utils.createMat4();        
        utils.perspective(projectionMatrix, fov, canvas.width / canvas.height, 0.00001, 100);

        camera.position = [
            camera.radius * Math.cos(camera.elevation) * Math.sin(camera.azimuth),
            camera.radius * Math.sin(camera.elevation),
            camera.radius * Math.cos(camera.elevation) * Math.cos(camera.azimuth)
        ];

        let viewMatrix = utils.createMat4();
        utils.lookAt(viewMatrix, camera.position, [0, 0, 0], [0, 1, 0]);

        utils.multiply(projectionMatrix, projectionMatrix, viewMatrix);

        console.log("Camera Position", camera.position);

        sphere.setShaderProgram('planet');
        sphere.setModelMatrix(
            [0, 0, 0],
            [(tilt * utils.rads) * isPlanetRotating, currentTime * ((rotation * utils.rads) * 0.7) * isPlanetRotating, (pitch * utils.rads) * isPlanetRotating],
            [1, 1, 1]
        );
        // console.log('position', sphere.getLocalPosition());
        // console.log('rotation', sphere.getLocalRotation());
        // console.log('scale', sphere.getLocalScale());
        sphere.setBuffers();
        let planetShader = shaderManager.getProgram('planet');
        gl.uniform1f(gl.getUniformLocation(planetShader!, 'uTime'), currentTime);
        gl.uniformMatrix4fv(gl.getUniformLocation(planetShader!, 'uProjectionMatrix'), false, projectionMatrix);
        gl.uniform1f(shaderManager.getUniformLocation(planetShader!, 'uCloudRotation'), cloudRotation * Math.PI / 180);
        gl.uniform4fv(gl.getUniformLocation(planetShader!, 'uCloudColor'), cloudColor.get_normalized_rgba());
        gl.uniform4fv(gl.getUniformLocation(planetShader!, 'uPlanetColor'), planetColor.get_normalized_rgba());
        shaderManager.assignTexture(gl.getUniformLocation(shaderManager.getProgram('planet')!, 'uTexturePlanet')!, planetTexture, 0);
        shaderManager.assignTexture(gl.getUniformLocation(shaderManager.getProgram('planet')!, 'uTextureCloud')!, cloudsTexture, 1);
        let lightPositionLocation = gl.getUniformLocation(planetShader!, 'uLightPosition');
        let lightDirectionLocation = gl.getUniformLocation(planetShader!, 'uLightDirection');
        let lightInnerLocation = gl.getUniformLocation(planetShader!, 'uLightInnerCutoff');
        let lightOuterLocation = gl.getUniformLocation(planetShader!, 'uLightOuterCutoff');

        gl.uniform3fv(lightPositionLocation, lightPosition);        // Example light position
        gl.uniform3fv(lightDirectionLocation, [0.0, 0.0, 50000.0]);       // Example direction
        gl.uniform1f(lightInnerLocation, utils.radians(80.0));         // Inner cone angle in radians
        gl.uniform1f(lightOuterLocation, utils.radians(90.0));         // Outer cone angle in radians
        sphere.render();

        requestAnimationFrame(render.bind(null, gl));
    }
    render(gl);
}

planetEngine({
    // Planet texturing information
    texturePlanetUrl: '/textures/arid.jpg',
    texturePlanetIsCompressed: false,
    textureCloudUrl: '/textures/clouds_desert01.png',
    textureCloudIsCompressed: false,
    textureBackgroundUrl: '/textures/background6.jpg',
    textureBackgroundIsCompressed: false,
    textureGlowUrl: '',
    textureGlowIsCompressed: false,

    // Planet rotation information
    rotation: 10.0,
    // tilt: 30.0, // Degrees
    // pitch: 45.0, // Degrees

    // Planet color information
    planetColor: new Color(255,255,255,255),

    // Planet atmosphere information
    atmosphereColor: new Color(0, 0, 0, 0),
    atmosphereThickness: 0.0,
    atmosphereThicknessMin: 0.0,

    // Planet clouds information
    cloudColor: new Color(255,255,255,255),
    cloudRotation: 15.0,

    // Lighting information
    lightPosition: [0,5,0],

    // Planet geometry information
    subdivisions: 32,
    radius: 1.0,

    // Camera information
    cameraDistance: 3,

    // GL settings
    canvasHeight: 500,
    canvasWidth: 500,


}); // Compression wip

