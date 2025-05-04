#version 300 es

in vec2 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    // vTexCoord = aTexCoord * vec2(0.5, 0.5);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}