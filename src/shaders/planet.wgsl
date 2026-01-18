struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal:   vec3<f32>,
    @location(2) uv:       vec2<f32>
}

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(1) vColor: vec3<f32>,
    @location(2) vUv:    vec2<f32>
}

struct Global {
    uTime: f32,
    _pad: vec3<f32>
}

@group(0) @binding(0) var<uniform> global: Global;

@vertex
fn vert(input: VertexInput) -> VertexOutput {
    let c = cos(global.uTime);
    let s = sin(global.uTime);

    // Rotate Position
    let x = input.position.x * c - input.position.y * s;
    let y = input.position.x * s + input.position.y * c;
    let z = input.position.z;

    // Rotate Normal
    let nx = input.normal.x * c - input.normal.y * s;
    let ny = input.normal.x * s + input.normal.y * c;
    let nz = input.normal.z;

    let rotatedNormal = normalize(vec3<f32>(nx, ny, nz));

    // Lighting
    let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
    let diffuse = max(dot(rotatedNormal, lightDir), 0.0);
    let ambient = 0.0;
    let finalBrightness = diffuse + ambient;

    var output: VertexOutput;
    output.Position = vec4<f32>(x, y, z, 1.0);
    output.vColor = vec3<f32>(finalBrightness, finalBrightness, finalBrightness);

    output.vUv = input.uv;

    return output;
}

@fragment
fn frag(input: VertexOutput) -> @location(0) vec4f {

    let r = input.vUv.x * input.vColor.r;
    let g = input.vUv.y * input.vColor.g;
    let b = 0.0;

    return vec4<f32>(r, g, b, 1.0);
}
