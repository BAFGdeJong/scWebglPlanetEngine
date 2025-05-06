#version 300 es
precision mediump float;

in vec2 aPosition;   // Position of each vertex (x, y)
in vec2 aTexCoord;   // Spherical UVs (u, v)

out vec2 vTexCoord;  // Pass UV to fragment shader

void main() {
    // Set position of vertex
    gl_Position = vec4(aPosition, 0.0, 1.0);

    // Pass texture coordinates (u, v) to fragment shader
    vTexCoord = aTexCoord;
}