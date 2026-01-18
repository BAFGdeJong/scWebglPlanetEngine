import {InputInfo, VariableInfo, WgslReflect} from "wgsl_reflect";
import {Mesh} from "./mesh.ts";

export class Attribute {
  info: InputInfo;

  public constructor(inputInfo: InputInfo) {
    this.info = inputInfo;
  }
}

export class Uniform {
  info: VariableInfo;

  public constructor(inputInfo: VariableInfo) {
    this.info = inputInfo;
  }
}

export class ShaderPackage {
  device: GPUDevice;
  shaderModule: GPUShaderModule;
  pipeline: GPURenderPipeline;
  reflection: WgslReflect;

  attributes: Record<string, Attribute> = {};
  uniforms: Record<string, Uniform> = {};

  bindGroups: Map<number, GPUBindGroup> = new Map();
  vertexStride: number = 0;

  bindGroupInfo: any[] = [];

  constructor(device: GPUDevice, label: string, shaderCode: string, format: GPUTextureFormat) {
    this.device = device;

    this.reflection = new WgslReflect(shaderCode);

    const vertexLayout = this.getVertexLayouts();

    this.setupAttributes();
    this.setupUniforms();

    this.shaderModule = device.createShaderModule({ code: shaderCode });

    this.pipeline = device.createRenderPipeline({
      label: label,
      layout: "auto",
      vertex: {
        module: this.shaderModule,
        entryPoint: "vert",
        buffers: vertexLayout,
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "frag",
        targets: [{ format: format }],
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
      multisample: {
        count: 4,
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back'
      }
    });

    this.bindGroupInfo = this.reflection.getBindGroups();
  }

  public setupAttributes() {
    const attributes = this.reflection.entry.vertex[0].inputs;

    attributes.forEach((attribute) => {
      this.attributes[attribute.name] = new Attribute(attribute);
    });
  }

  public setupUniforms() {
    const uniforms = this.reflection.uniforms;

    uniforms.forEach((uniform) => {
      this.uniforms[uniform.name] = new Uniform(uniform);
    });
  }

  public bindMesh(pass: GPURenderPassEncoder, mesh: Mesh) {

    if (this.attributes['position'] !== undefined && mesh.buffers['position']) {
      pass.setVertexBuffer(this.attributes.position.info.location as number, mesh.buffers['position']);
    }

    if (this.attributes['uv'] !== undefined && mesh.buffers['uv']) {
      pass.setVertexBuffer(this.attributes.uv.info.location as number, mesh.buffers['uv']);
    }

    if (this.attributes['normal'] !== undefined && mesh.buffers['normal']) {
      pass.setVertexBuffer(this.attributes.normal.info.location as number, mesh.buffers['normal']);
    }

    if (mesh.buffers['indice']) {
      pass.setIndexBuffer(mesh.buffers['indice'], 'uint32');
      pass.drawIndexed(mesh.indexCount);
    } else {
      pass.draw(mesh.vertexCount)
    }

  }

  private getVertexLayouts(): GPUVertexBufferLayout[] {
    // 1. Find the vertex entry point (usually "vert" or "main")
    const vertexEntry = this.reflection.entry.vertex.find(e => e.name === "vert");

    if (!vertexEntry || !vertexEntry.inputs) return [];

    const layouts: GPUVertexBufferLayout[] = [];

    // 2. Iterate over inputs (Position, Normal, UV, etc.)
    // @ts-ignore - Ignoring strict check on 'inputs' source for now
    vertexEntry.inputs.sort((a, b) => Number(a.location) - Number(b.location)).forEach((input) => {

      // Resolve the WebGPU format (e.g., "float32x3")
      const format = this.mapTypeToFormat(input.type?.getTypeName()!);

      // Resolve the byte size (e.g., 12)
      const size = this.getByteSize(format);

      // 3. Push a separate layout for this buffer
      layouts.push({
        arrayStride: size,      // Stride matches the size of this one attribute
        stepMode: "vertex",
        attributes: [{
          shaderLocation: Number(input.location), // FIX: Force convert to number
          offset: 0,            // Always 0 for separate buffers
          format: format
        }]
      });
    });

    return layouts;
  }

  createBindGroup(label: string, groupIndex: number, resources: Record<string, GPUBuffer | GPUTextureView | GPUSampler>) {

    const groupBindings = this.bindGroupInfo.find(
        bindings => {
          if (bindings != null) { return bindings.length > 0 && bindings[0].group === groupIndex }
        }
    );

    if (!groupBindings) {
      console.warn(`Skipping BindGroup ${groupIndex}: Shader does not use it.`);
      return null;
    }

    const entries: GPUBindGroupEntry[] = [];

    groupBindings.forEach((bindingDef: any) => {
      const name = bindingDef.name;
      const resource = resources[name];

      if (!resource) {
        console.warn(`Shader expects '${name}' at binding(${bindingDef.binding}) but it was missing!`);
        return;
      }

      let resourceEntry: GPUBindingResource;
      if (resource instanceof GPUBuffer) resourceEntry = { buffer: resource };
      else if (resource instanceof GPUTextureView) resourceEntry = resource;
      else resourceEntry = resource as GPUSampler;

      entries.push({
        binding: bindingDef.binding,
        resource: resourceEntry
      });
    });

    const a = this.device.createBindGroup({
      label: label,
      layout: this.pipeline.getBindGroupLayout(groupIndex),
      entries: entries
    });

    this.bindGroups.set(groupIndex, a);

    return a;
  }

  private mapTypeToFormat(type: string): GPUVertexFormat {
    const t = type.toLowerCase().trim();

    if (t === "f32" || t === "float") return "float32";
    if (t === "vec2<f32>" || t === "vec2f") return "float32x2";
    if (t === "vec3<f32>" || t === "vec3f") return "float32x3";
    if (t === "vec4<f32>" || t === "vec4f") return "float32x4";

    if (t === "u32" || t === "uint") return "uint32";
    if (t === "i32" || t === "int")  return "sint32";

    console.warn(`Unknown vertex format: ${type}, defaulting to float32x3`);
    return "float32x3";
  }

  private getByteSize(format: GPUVertexFormat): number {
    switch (format) {
      case "float32":   return 4;
      case "float32x2": return 8;
      case "float32x3": return 12;
      case "float32x4": return 16;
      case "uint32":    return 4;
      case "sint32":    return 4;
      default: return 0;
    }
  }
}
