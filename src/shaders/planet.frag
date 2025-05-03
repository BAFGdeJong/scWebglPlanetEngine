#version 300 es
precision highp float;

in vec2 vTexCoord;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexturePlanet;
uniform sampler2D uTextureCloud;
uniform float uTime;
uniform float uCloudRotation;
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
    vec2 planetTexCoord = vec2(vTexCoord.x, vTexCoord.y) + vec2(uTime * uRotation, 0.0);
    vec4 tempPlanetColor = texture(uTexturePlanet, planetTexCoord);
    vec4 planetColor = tempPlanetColor * uPlanetColor;

    vec2 cloudTexCoord = vTexCoord + (uTime * vec2(uCloudRotation * 0.09, 0.0));
    vec4 tempCloudColor = texture(uTextureCloud, cloudTexCoord);
    vec4 cloudColor = tempCloudColor * uCloudColor;

    vec4 blendedColor = mix(planetColor, cloudColor, cloudColor.a);

    vec3 offset = uLightPosition - vPosition;
    vec3 surfaceToLight = normalize(offset);
    vec3 lightToSurface = -surfaceToLight;

    float diffuse = max(0.0, dot(surfaceToLight, normalize(vNormal)));

    float angleToSurface = acos(dot(lightToSurface, normalize(uLightDirection)));
    float spot = smoothstep(uLightOuterCutoff, uLightInnerCutoff, angleToSurface);

    float rawBrightness = diffuse * spot * 2.0;
    float brightness = max(rawBrightness, 0.4);

    vec3 litColor = blendedColor.rgb * brightness; // Dunno why, but this fixes lighting transparancy problem.

    fragColor = vec4(litColor, 1.0);

    // fragColor = mix(planetColor, cloudColor, cloudColor.a);

    // vec4 text = texture(uTexturePlanet, vTexCoord);
    // fragColor = text;
    // fragColor = vec4(0.0, 1.0, 1.0, 1.0);
}