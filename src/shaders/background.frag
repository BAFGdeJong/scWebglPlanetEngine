#version 300 es

precision highp float;

uniform sampler2D uTextureBackground;
uniform float uTextureAspectRatio;
uniform float uQuadAspectRatio;
in vec2 vTexCoord;

out vec4 fragColor;

void main() {
    float scaleX = uQuadAspectRatio / uTextureAspectRatio;
    float scaleY = uQuadAspectRatio / uTextureAspectRatio;

    vec2 adjustedTexCoord = vTexCoord;

    // adjustedTexCoord.x = clamp(((adjustedTexCoord.x - 0.5) * scaleX + 0.5), 0.0, 1.0);
    // adjustedTexCoord.y = clamp(((adjustedTexCoord.y - 0.5) * scaleY + 0.5), 0.0, 1.0);  TODO correct background scaling

    fragColor = texture(uTextureBackground, adjustedTexCoord);
    // fragColor = vec4(adjustedTexCoord, 0.0, 1.0);
}