#version 300 es

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform vec3 uSphereTranslation;
uniform mat4 uViewProjectionMatrix;

out vec3 vPosition;
out vec3 vNormal;

void main() {
    vNormal = mat3(uModelMatrix) * aNormal; // Transform normal to world space

    vec3 translatedPosition = aPosition + uSphereTranslation;
    vec4 worldPosition = uModelMatrix * vec4(translatedPosition, 1.0);

    vPosition = worldPosition.xyz; // World-space position

    gl_Position = uViewProjectionMatrix * vec4(vPosition, 1.0);
}