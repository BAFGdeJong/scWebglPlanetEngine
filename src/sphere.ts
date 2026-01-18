import {MeshData} from "./mesh.ts";

export class SphereMesh {
  readonly positions: Float32Array;
  readonly indices: Uint32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly radius: number;
  readonly iterations: number;
  readonly meshData: MeshData;

  constructor(iterations = 2, radius = 1) {
    this.iterations = iterations;
    this.radius = radius;

    this.meshData = this.generateSphere(iterations, radius);

    const { positions, indices, normals, uvs } = this.meshData;
    this.positions = positions;
    this.indices = indices;
    // @ts-ignore
    this.normals = normals;
    // @ts-ignore
    this.uvs = uvs;
  }

  /** Generates a subdivided sphere mesh (octahedron-based). */
  private generateSphere(iterations: number, radius: number): MeshData {
    // 1. Initial Octahedron Vertices
    let vertices: [number, number, number][] = [
      [0, 0, 1],
      [0, 0, -1],
      [-1, -1, 0],
      [1, -1, 0],
      [1, 1, 0],
      [-1, 1, 0],
    ].map(v => scale(normalize(v as [number, number, number]), radius));

    // 2. Initial Octahedron Faces (Indices)
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

    // 3. Subdivision Loop
    for (let it = 0; it < iterations; it++) {
      const newFaces: [number, number, number][] = [];
      const midpointCache = new Map<string, number>();

      const getMidpoint = (i1: number, i2: number): number => {
        // Cache key to prevent duplicate vertices at the same position
        const key = i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
        if (midpointCache.has(key)) return midpointCache.get(key)!;

        const v1 = vertices[i1];
        const v2 = vertices[i2];

        // Calculate mid point and push it to radius surface
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

      // Subdivide every face into 4 smaller triangles
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

    // 4. Generate Output Arrays
    const positionArray = new Float32Array(vertices.flat());
    const indexArray = new Uint32Array(faces.flat());

    // Normals are just the normalized position (since it's a sphere centered at 0,0,0)
    const normalArray = new Float32Array(vertices.map(v => normalize(v)).flat());

    // 5. Generate UVs (Spherical Mapping)
    const uvArray = new Float32Array(vertices.length * 2);

    for (let i = 0; i < vertices.length; i++) {
      // Get direction vector (normalized position)
      const vl = vertices[i];
      const len = Math.hypot(vl[0], vl[1], vl[2]);
      const nx = vl[0] / len;
      const ny = vl[1] / len;
      const nz = vl[2] / len;

      // Calculate Longitude (U)
      // atan2(z, x) gives angle in radians [-PI, PI]
      // We divide by 2PI to get [-0.5, 0.5], then add 0.5 to get [0, 1]
      const u = 0.5 + (Math.atan2(nz, nx) / (2 * Math.PI));

      // Calculate Latitude (V)
      // asin(y) gives angle [-PI/2, PI/2] (North/South pole)
      // Map to [0, 1]
      const v = 0.5 - (Math.asin(ny) / Math.PI);

      uvArray[i * 2] = u;
      uvArray[i * 2 + 1] = v;
    }

    return {
      positions: positionArray,
      indices: indexArray,
      normals: normalArray,
      uvs: uvArray
    };
  }
}

// ----------------- Helpers -----------------

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]);
  // Prevent division by zero
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function scale(v: [number, number, number], s: number): [number, number, number] {
  return [v[0] * s, v[1] * s, v[2] * s];
}
