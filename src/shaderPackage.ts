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

    const vertexLayout = this.getVertexLayout();

    this.setupAttributes();
    this.setupUniforms();

    this.shaderModule = device.createShaderModule({ code: shaderCode });

    this.pipeline = device.createRenderPipeline({
      label: label,
      layout: "auto",
      vertex: {
        module: this.shaderModule,
        entryPoint: "vert",
        buffers: vertexLayout ? [vertexLayout] : [],
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

  private getVertexLayout(): GPUVertexBufferLayout | null {
    const vertexEntry = this.reflection.entry.vertex.find(e => e.name === "vert");
    if (!vertexEntry || !vertexEntry.inputs) return null;

    const attributes: GPUVertexAttribute[] = [];
    let stride = 0;

    // @ts-ignore
    vertexEntry.inputs.sort((a, b) => a.location - b.location).forEach(input => {

      const format = this.mapTypeToFormat(input.type);
      const size = this.getByteSize(format);

      attributes.push(<GPUVertexAttribute>{
        shaderLocation: input.location,
        offset: stride,
        format: format
      });

      stride += size;
    });

    this.vertexStride = stride;

    if (stride === 0) return null;

    return {
      arrayStride: stride,
      attributes: attributes,
      stepMode: "vertex"
    };
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

  private mapTypeToFormat(type: any): GPUVertexFormat {
    if (type.name === 'vec3' && type.format.name === 'f32') return 'float32x3';
    if (type.name === 'vec2' && type.format.name === 'f32') return 'float32x2';
    if (type.name === 'vec4' && type.format.name === 'f32') return 'float32x4';
    return 'float32';
  }

  private getByteSize(format: GPUVertexFormat): number {
    if (format === 'float32x3') return 12;
    if (format === 'float32x4') return 16;
    if (format === 'float32x2') return 8;
    return 4;
  }
}
