const pos = array(
    vec2f(-0.5, 0.5),  // top left
    vec2f(-0.5, -0.5),  // lower left
    vec2f( 0.5, 0.5),   // top right
    vec2f( 0.5, 0.5),  // top right
    vec2f(-0.5, -0.5),  // middle left
    vec2f( 0.5, -0.5)   // lower right
);

@vertex fn vs(
    @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {

    return vec4f(pos[vertexIndex], 0.0, 1.0);

}

@fragment fn fs(
    @builtin(vertex_index) vertexIndex : u32
) -> @location(0) vec4f {

    return vec4f(pos, 0.0, 1.0);

}