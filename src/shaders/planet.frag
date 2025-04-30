#version 300 es
    // #pragma vscode_glsllint_stage: frag
    precision highp float;

    in vec2 vTexCoord;
    in vec3 vPosition;
    in vec3 vNormal;

    uniform sampler2D uTexture;
    uniform sampler2D uTextureCloud;
    uniform float uTime; // Time uniform for animation
    uniform float uCloudRotation; // Speed of cloud movement
    uniform float uRotation;
    uniform vec4 uCloudColor;
    uniform vec4 uPlanetColor;

    // Spotlight uniforms
    uniform vec3 uLightPosition;
    uniform vec3 uLightDirection;
    uniform float uLightInnerCutoff;
    uniform float uLightOuterCutoff;

    out vec4 fragColor;

    void main() {
        // === Planet & Cloud Texture Blending ===
        vec2 planetTexCoord = vec2(vTexCoord.x, vTexCoord.y) + vec2(uTime * uRotation, 0.0);
        vec4 tempPlanetColor = texture(uTexture, planetTexCoord);
        vec4 planetColor = tempPlanetColor * uPlanetColor;

        vec2 cloudTexCoord = vTexCoord + (uTime * vec2(uCloudRotation * 0.09, 0.0));
        vec4 tempCloudColor = texture(uTextureCloud, cloudTexCoord);
        vec4 cloudColor = tempCloudColor * uCloudColor;

        vec4 blendedColor = mix(planetColor, cloudColor, cloudColor.a);

        // === Spotlight Lighting ===
        vec3 offset = uLightPosition - vPosition;
        vec3 surfaceToLight = normalize(offset);
        vec3 lightToSurface = -surfaceToLight;

        float diffuse = max(0.0, dot(surfaceToLight, normalize(vNormal)));
        float angleToSurface = acos(dot(lightToSurface, normalize(uLightDirection)));
        float spot = smoothstep(uLightOuterCutoff, uLightInnerCutoff, angleToSurface);

        float brightness = diffuse * spot;

        // Final color with lighting applied
        fragColor = blendedColor * spot;
        fragColor.a = 1.0;
    }