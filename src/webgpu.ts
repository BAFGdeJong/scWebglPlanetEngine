import {WebRenderer} from "./webrenderer.ts";
import {ShaderPackage} from "./shaderPackage.ts";
import { Entity } from "./entity.ts";
import {Material} from "./material.ts";

export type TypedArray =
    | Float32Array
    | Uint32Array
    | Int32Array
    | Uint16Array
    | Int16Array
    | Uint8Array
    | Int8Array;

export class WebGpuRenderer implements WebRenderer {
  context: GPUCanvasContext;
  canvas: HTMLCanvasElement;

  // @ts-ignore
  adapter: GPUAdapter;
  // @ts-ignore
  device: GPUDevice;
  // @ts-ignore
  format: GPUTextureFormat;

  shaders: Map<string, ShaderPackage> = new Map();
  updates: (() => void)[] = [];

  globalBindGroup: GPUBindGroup | undefined;
  globalBuffer: GPUBuffer | undefined;
  time = new Float32Array([0, 0, 0, 0]);

  entities: Entity[] = [];

  depthTexture: GPUTexture | undefined;
  msaaTexture: GPUTexture | undefined;
  frameCount: number = 0;

  public constructor(context: GPUCanvasContext, canvas: HTMLCanvasElement) {
    this.context = context;
    this.canvas = canvas;
  }

  async init(): Promise<void> {
    if (!navigator.gpu) throw new Error("WebGPU not supported");

    this.adapter = (await navigator.gpu.requestAdapter({
      // powerPreference: "high-performance" // Doesn't work on windows atm
    }))!;

    if (!this.adapter) throw new Error("No Adapter Found");

    this.device = await this.adapter.requestDevice({});

    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device: this.device, format: this.format, alphaMode: "opaque" });

    if (this.canvas.width > 0 && this.canvas.height > 0) {
      this.resizeDepthTexture();
    }
  }

  private resizeDepthTexture() {
    if (this.canvas.width === 0 || this.canvas.height === 0) return;

    if (this.depthTexture) this.depthTexture.destroy();
    if (this.msaaTexture) this.msaaTexture.destroy();

    const size: [number, number] = [this.canvas.width, this.canvas.height];

    this.msaaTexture = this.device.createTexture({
      size: size,
      sampleCount: 4,
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.depthTexture = this.device.createTexture({
      size: size,
      sampleCount: 4,
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
  }

  public getContext(): GPUCanvasContext {
    return this.context;
  }
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  public getDevice(): GPUDevice {
    return this.device;
  }

  public createBuffer(label: string, data: TypedArray, usage: GPUBufferUsageFlags): GPUBuffer {
    const alignedSize = (data.byteLength + 3) & ~3;

    const buffer = this.device.createBuffer({
      label: label,
      size: alignedSize,
      usage,
      mappedAtCreation: true,
    });

    const mappedRange = buffer.getMappedRange();
    const Constructor = data.constructor as { new(buffer: ArrayBuffer): TypedArray };
    const view = new Constructor(mappedRange);
    view.set(data);
    buffer.unmap();

    return buffer;
  }

  public addUpdate(updater: (() => void)): void {
    this.updates.push(updater)
  }
  public addEntity(index: number, entity: Entity): void {
    this.entities[index] = entity;
  }
  public removeEntity(index: number): void {
    this.entities.splice(index, 1);
  }

  public createShader(shaderPackageName: string, shaderCode: string): ShaderPackage {
    const shaderPackage = new ShaderPackage(this.device, shaderPackageName, shaderCode, this.format);
    this.shaders.set(shaderPackageName, shaderPackage);

    if (!this.globalBindGroup) {
      this.globalBuffer = this.device.createBuffer({
        label: 'global',
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });

      this.globalBindGroup = this.device.createBindGroup({
        layout: shaderPackage.pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: this.globalBuffer
          }
        }]
      });
    }

    return shaderPackage;
  }

  private drawFrame(): void {
    if (!this.globalBindGroup || !this.msaaTexture || !this.depthTexture) return;

    const encoder = this.device.createCommandEncoder();

    const canvasTextureView = this.context.getCurrentTexture().createView();

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.msaaTexture.createView(),

        resolveTarget: canvasTextureView,

        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1 },
        loadOp: "clear",
        storeOp: "discard",
      }],

      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'discard',
      }
    });

    pass.setBindGroup(0, this.globalBindGroup);

    let previousShader: ShaderPackage | null = null;
    let lastMaterial: Material | null = null;

    for (const entity of this.entities) {
      const shader = entity.material.shader;

      if (previousShader !== shader) {
        pass.setPipeline(shader.pipeline);
        previousShader = shader;
        lastMaterial = null;
      }

      if (shader.bindGroups.has(1) && entity.material !== lastMaterial) {
        pass.setBindGroup(1, entity.material.group);
        lastMaterial = entity.material;
      }

      if (shader.bindGroups.has(2) && entity.transform !== null) {
        entity.updateTransform(this);
        pass.setBindGroup(2, entity.group);
      }

      entity.draw(pass);
    }

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  public run(targetFPS: number) {
    const frameInterval = 1000 / targetFPS;
    let lastTime = performance.now();

    const loop = () => {
      requestAnimationFrame(loop);

      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed > frameInterval) {
        lastTime = now - (elapsed % frameInterval);

        this.time[0] = now / 1000;
        if (this.globalBuffer) {
          this.device.queue.writeBuffer(this.globalBuffer, 0, this.time);
        }

        for (const update of this.updates) update();

        this.drawFrame();

        this.frameCount++;
      }
    };

    loop();
  }

  public clearFrame(): void {
    requestAnimationFrame(() => {
      const encoder = this.device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        }],
      });

      pass.end();
      this.device.queue.submit([encoder.finish()]);
    });
  }
}

