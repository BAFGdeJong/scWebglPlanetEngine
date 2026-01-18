struct VertexInput {
    @location(0) position: vec3<f32>
}
//
struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(1) vColor: vec3<f32>
}

struct Global {
    uTime: f32
}

@group(0) @binding(0) var<uniform> global: Global;

//
//@group(0) @binding(1) var<uniform> color: vec4<f32>;
//@group(3) @binding(0) var<uniform> time: f32;

@vertex
fn vert(input: VertexInput) -> VertexOutput {
    let c = cos(global.uTime);
    let s = sin(global.uTime);

    let x = input.position.x * c - input.position.y * s;
    let y = input.position.x * s + input.position.y * c;

    var output: VertexOutput;
    output.Position = vec4<f32>(x, y, input.position.z, 1.0);
    output.vColor = vec3<f32>(input.position.x, input.position.y, input.position.z);

    return output;
}

@fragment
fn frag(input: VertexOutput) -> @location(0) vec4f {
//    let red = (sin(uTime) + 1.0) * 0.5;
//    let k = cos(Utime);
    return vec4(input.vColor, 1.0);
}
