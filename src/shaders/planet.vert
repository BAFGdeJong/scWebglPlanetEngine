#version 300 es
// #pragma vscode_glsllint_stage: vert
    
in vec3 aPosition;
in vec2 aTexCoord;
in vec3 aNormal;
out vec3 vNormal;
out vec3 vPosition;
out vec2 vTexCoord;
uniform mat4 uTotalProjectionMatrix;
uniform vec3 uSphereTranslation;
uniform mat4 uModelMatrix;

void main() {
    vNormal = aNormal;
    
    // Apply translation and transformation to get the world position
    vec3 translatedPosition = aPosition + uSphereTranslation;
    vec4 worldPosition = uModelMatrix * vec4(translatedPosition, 1.0);  // Transform to world space
    
    vPosition = worldPosition.xyz;  // Pass the world position to the fragment shader
    
    vTexCoord = aTexCoord;
    gl_Position = uTotalProjectionMatrix * uModelMatrix * vec4(translatedPosition, 1.0);
}