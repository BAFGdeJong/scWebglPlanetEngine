import {WebRenderer} from "./webrenderer.ts";

export interface MeshData {
  positions: Float32Array;
  indices: Uint32Array;
  uvs?: Float32Array;
  normals?: Float32Array;
}

export class Mesh {
  buffers: Record<string, GPUBuffer> = {};
  vertexCount: number = 0;
  indexCount: number = 0;

  public constructor(renderer: WebRenderer, data: MeshData) {
    this.vertexCount = data.positions.length / 3; // Assuming vec3
    this.indexCount = data.positions.length;

    this.buffers['position'] = renderer.createBuffer('position', data.positions, GPUBufferUsage.VERTEX);
    // this.buffers['uv'] = renderer.createBuffer('uv', data.uvs, GPUBufferUsage.VERTEX);
    // this.buffers['normal'] = renderer.createBuffer('normal', data.normals, GPUBufferUsage.VERTEX);
    this.buffers['indice'] = renderer.createBuffer('indice', data.indices, GPUBufferUsage.INDEX);
  }
}
