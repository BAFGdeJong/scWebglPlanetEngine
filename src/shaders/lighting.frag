#version 300 es
precision highp float;

in vec2 vUV;
uniform sampler2D uBlendedColor;
uniform sampler2D uNormalTex;
uniform sampler2D uPositionTex;

uniform vec3 uLightPosition;
uniform vec3 uLightDirection;
uniform float uLightInnerCutoff;
uniform float uLightOuterCutoff;

out vec4 fragColor;

void main() {
    vec3 color = texture(uBlendedColor, vUV).rgb;
    vec3 normal = normalize(texture(uNormalTex, vUV).xyz * 2.0 - 1.0);
    vec3 position = texture(uPositionTex, vUV).xyz;

    vec3 offset = uLightPosition - position;
    vec3 surfaceToLight = normalize(offset);
    vec3 lightToSurface = -surfaceToLight;

    float diffuse = max(dot(surfaceToLight, normal), 0.0);
    float angleToSurface = acos(dot(lightToSurface, normalize(uLightDirection)));
    float spot = smoothstep(uLightOuterCutoff, uLightInnerCutoff, angleToSurface);

    fragColor = vec4(color * diffuse * spot, 1.0);
}