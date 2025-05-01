attribute vec3 a_position;
uniform mat4 uTotalProjectionMatrix;
uniform mat4 uModelMatrix;

void main() {
    gl_Position = uTotalProjectionMatrix * uModelMatrix * vec4(a_position, 1.0);
}