import {Mesh} from "./mesh.ts";
import {Material} from "./material.ts";
import {mat4, vec3} from "wgpu-matrix";
import {WebRenderer} from "./webrenderer.ts";

export class Entity {
  mesh: Mesh;
  material: Material;

  position: Float32Array = vec3.fromValues(0, 0, 0);
  rotation: Float32Array = vec3.fromValues(0, 0, 0); // Euler angles (X, Y, Z)
  scale:    Float32Array = vec3.fromValues(1, 1, 1);

  transform: Float32Array; // Position/Rotation/Scale matrix TODO
  transformBuffer: GPUBuffer;
  group: null | GPUBindGroup;

  public constructor(renderer: WebRenderer, mesh: Mesh, material: Material) {
    this.mesh = mesh;
    this.material = material;

    this.transform = mat4.create() as Float32Array;

    this.transformBuffer = renderer.getDevice().createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM
    });

    this.group = material.shader.createBindGroup("transform",2, {
      model: this.transformBuffer
    });
  }

  public updateTransform(renderer: WebRenderer) {
    mat4.identity(this.transform);

    mat4.translate(this.transform, this.transform, this.position);

    mat4.rotateX(this.transform, this.rotation[0]);
    mat4.rotateY(this.transform, this.rotation[1]);
    mat4.rotateZ(this.transform, this.rotation[2]);

    mat4.scale(this.transform, this.transform, this.scale);

    renderer.getDevice().queue.writeBuffer(
        this.transformBuffer,
        0,
        this.transform as Float32Array<ArrayBuffer>
    );
  }

  public draw(pass: GPURenderPassEncoder): void {
    this.material.shader.bindMesh(pass, this.mesh);
  }
}
