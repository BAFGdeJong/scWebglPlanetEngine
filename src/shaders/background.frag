#version 300 es

precision highp float;

uniform sampler2D uTextureBackground;
in vec2 vTexCoord;

out vec4 fragColor;

void main() {
    fragColor = texture(uTextureBackground, vTexCoord);
}