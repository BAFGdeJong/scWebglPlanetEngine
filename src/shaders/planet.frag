#version 300 es
precision highp float;

in vec2 vTexCoord;
// uniform sampler2D uTexturePlanet;
// uniform sampler2D uTextureCloud;
// uniform float uTime;
// uniform float uCloudRotation;
// uniform float uRotation;
// uniform vec4 uCloudColor;
// uniform vec4 uPlanetColor;

out vec4 fragColor;

void main() {
    // vec2 planetTexCoord = vec2(vTexCoord.x, vTexCoord.y) + vec2(uTime * uRotation, 0.0);
    // vec4 tempPlanetColor = texture(uTexturePlanet, planetTexCoord);
    // vec4 planetColor = tempPlanetColor * uPlanetColor;

    // vec2 cloudTexCoord = vTexCoord + (uTime * vec2(uCloudRotation * 0.09, 0.0));
    // vec4 tempCloudColor = texture(uTextureCloud, cloudTexCoord);
    // vec4 cloudColor = tempCloudColor * uCloudColor;

    // fragColor = mix(planetColor, cloudColor, cloudColor.a);
    fragColor = vec4(0.0, 0.0, 1.0, 1.0);
}