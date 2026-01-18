import {MeshData} from "./mesh.ts";

export class SphereMesh {
  readonly positions: Float32Array;
  readonly indices: Uint32Array;
  readonly normals: Float32Array | undefined;
  readonly radius: number;
  readonly iterations: number;
  readonly meshData: MeshData;

  constructor(iterations = 2, radius = 1) {
    this.iterations = iterations;
    this.radius = radius;

    this.meshData = this.generateSphere(iterations, radius)
    const { positions, indices, normals } = this.meshData;
    this.positions = positions;
    this.indices = indices;
    this.normals = normals;
  }

  /** Generates a subdivided sphere mesh (octahedron-based). */
  private generateSphere(iterations: number, radius: number): MeshData {
    let vertices: [number, number, number][] = [
      [0, 0, 1],
      [0, 0, -1],
      [-1, -1, 0],
      [1, -1, 0],
      [1, 1, 0],
      [-1, 1, 0],
    ].map(v => scale(normalize(v as [number, number, number]), radius));

    let faces: [number, number, number][] = [
      [0, 3, 4],
      [0, 4, 5],
      [0, 5, 2],
      [0, 2, 3],
      [1, 4, 3],
      [1, 5, 4],
      [1, 2, 5],
      [1, 3, 2],
    ];

    for (let it = 0; it < iterations; it++) {
      const newFaces: [number, number, number][] = [];
      const midpointCache = new Map<string, number>();

      const getMidpoint = (i1: number, i2: number): number => {
        const key = i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
        if (midpointCache.has(key)) return midpointCache.get(key)!;
        const v1 = vertices[i1], v2 = vertices[i2];
        const mid: [number, number, number] = normalize([
          (v1[0] + v2[0]) / 2,
          (v1[1] + v2[1]) / 2,
          (v1[2] + v2[2]) / 2,
        ]);
        vertices.push(scale(mid, radius));
        const index = vertices.length - 1;
        midpointCache.set(key, index);
        return index;
      };

      for (const [a, b, c] of faces) {
        const ab = getMidpoint(a, b);
        const bc = getMidpoint(b, c);
        const ca = getMidpoint(c, a);
        newFaces.push([a, ab, ca]);
        newFaces.push([ab, b, bc]);
        newFaces.push([bc, c, ca]);
        newFaces.push([ab, bc, ca]);
      }
      faces = newFaces;
    }

    const positions = new Float32Array(vertices.flat());
    const indices = new Uint32Array(faces.flat());
    const normals = new Float32Array(vertices.map(v => normalize(v)).flat());

    return { positions, indices, normals };
  }

  /** Creates GPU buffers ready for rendering */
  // createGPUBuffers(device: GPUDevice) {
  //   const vertexBuffer = device.createBuffer({
  //     size: this.positions.byteLength,
  //     usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  //     mappedAtCreation: true,
  //   });
  //   new Float32Array(vertexBuffer.getMappedRange()).set(this.positions);
  //   vertexBuffer.unmap();
  //
  //   const indexBuffer = device.createBuffer({
  //     size: this.indices.byteLength,
  //     usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  //     mappedAtCreation: true,
  //   });
  //   new Uint32Array(indexBuffer.getMappedRange()).set(this.indices);
  //   indexBuffer.unmap();
  //
  //   return { vertexBuffer, indexBuffer };
  // }
}

// ----------------- helpers -----------------
function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]);
  return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
}

function scale(v: [number, number, number], s: number): [number, number, number] {
  return [v[0] * s, v[1] * s, v[2] * s];
}
