#version 300 es
precision highp float;

in vec2 vTexCoord;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexturePlanet;
uniform sampler2D uTextureCloud;

uniform float uTime;
uniform float uCloudRotation;
uniform float uRotation;
uniform vec4 uCloudColor;
uniform vec4 uPlanetColor;
uniform vec3 uCameraPosition;

// Spotlight uniforms
uniform vec3 uLightPosition;
uniform vec3 uLightDirection;
uniform float uLightInnerCutoff;
uniform float uLightOuterCutoff;

out vec4 fragColor;

    // // Calculate the view direction (from the camera to the fragment)
    // vec3 viewDir = normalize(uCameraPosition - vPosition);

    // // Calculate the dot product of the normal and the view direction
    // float edgeFactor = dot(vNormal, viewDir);

    // // If the dot product is close to 0, it's an edge (perpendicular normal to view)
    // if (abs(edgeFactor) < 0.1) {
    //     // If the fragment is near an edge, make it brighter (glowing effect)
    //     gl_FragColor = vec4(1.0, 0.8, 0.0, 1.0);  // A bright yellow glow (or atmosphere color)
    // } else {
    //     // Otherwise, just sample the texture
    //     vec4 color = texture2D(uTexture, gl_FragCoord.xy);
    //     gl_FragColor = color;
    // }

void main() {
    vec2 planetTexCoord = vec2(vTexCoord.x, vTexCoord.y) + vec2(uTime * uRotation, 0.0);
    vec4 tempPlanetColor = texture(uTexturePlanet, planetTexCoord);
    vec4 planetColor = tempPlanetColor * uPlanetColor;

    vec2 cloudTexCoord = vTexCoord + (uTime * vec2(uCloudRotation * 0.09, 0.0));
    vec4 tempCloudColor = texture(uTextureCloud, cloudTexCoord);
    vec4 cloudColor = tempCloudColor * uCloudColor;

    vec4 blendedColor = mix(planetColor, cloudColor, cloudColor.a);

    vec3 offset = uLightPosition - vPosition;
    vec3 surfaceToLight = normalize(offset);
    vec3 lightToSurface = -surfaceToLight;

    float diffuse = max(0.0, dot(surfaceToLight, normalize(vNormal)));

    float angleToSurface = acos(dot(lightToSurface, normalize(uLightDirection)));
    float spot = smoothstep(uLightOuterCutoff, uLightInnerCutoff, angleToSurface);

    float rawBrightness = diffuse * spot * 1.0;
    float brightness = max(rawBrightness, 1.0);

    vec3 litColor = blendedColor.rgb * brightness; // Dunno why, but this fixes lighting transparancy problem.

    fragColor = vec4(litColor, 1.0);

    // fragColor = mix(planetColor, cloudColor, cloudColor.a);

    // vec4 text = texture(uTexturePlanet, vTexCoord);
    // fragColor = text;
    // fragColor = vec4(0.0, 1.0, 1.0, 1.0);
}