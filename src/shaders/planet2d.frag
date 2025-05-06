#version 300 es
precision mediump float;

uniform sampler2D uPlanetTexture;  // The texture sampler
// uniform float uTextureAspectRatio;  // Aspect ratio of the texture
// uniform float uQuadAspectRatio;     // Aspect ratio of the quad

in vec2 vTexCoord;  // UV coordinates passed from vertex shader

out vec4 fragColor;

void main() {
    // Print texture coordinates for debugging
    vec2 texCoord = vTexCoord;
    texCoord = clamp(texCoord, vec2(0.0), vec2(1.0)); // Ensure they stay within range [0, 1]
    
    // Sample the texture
    fragColor = texture(uPlanetTexture, texCoord);
}