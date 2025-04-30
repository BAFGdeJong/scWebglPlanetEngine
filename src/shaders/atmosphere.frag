#version 300 es

precision highp float;

in vec3 vPosition;
in vec3 vNormal;

// uniform vec3 uLightPosition; // Light source position
uniform vec3 uPlanetCenter;  // Planet's center position
uniform vec3 uAtmosphereColor; // Atmosphere color
uniform float uAtmosphereRadius; // Outer radius of the atmosphere
uniform float uPlanetRadius; // Radius of the planet

out vec4 fragColor;

void main() {
    // Calculate normalized direction vectors
    // vec3 lightDir = normalize(uLightPosition - vPosition);
    vec3 viewDir = normalize(vPosition - uPlanetCenter);
    vec3 normal = normalize(vNormal);

    // Calculate the distance from the planet's center
    float dist = length(vPosition - uPlanetCenter);

    // Atmosphere falloff based on distance
    float atmosphereFactor = smoothstep(uPlanetRadius, uAtmosphereRadius, dist);

    // Light scattering effect
    // float scattering = max(dot(normal, lightDir), 0.0);

    // Combine scattering and atmosphere falloff
    vec3 atmosphereColor = uAtmosphereColor * atmosphereFactor;

    // Additive blending for glow effect
    fragColor = vec4(atmosphereColor, atmosphereFactor * 0.5); // Adjust alpha for transparency
    fragColor = vec4(1.0, 0.0, 1.0, 1.0); // Set alpha to 1.0 for full opacity
}