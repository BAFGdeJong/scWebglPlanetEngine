import {ShaderPackage} from "./shaderPackage.ts";

export class Material {
  shader: ShaderPackage;
  group: null | GPUBindGroup;

  public constructor(shader: ShaderPackage, uniforms: any) {
    this.shader = shader;
    this.group = shader.createBindGroup("material", 1, uniforms); // TODO label
  }
}
