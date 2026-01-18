import {ShaderPackage} from "./shaderPackage.ts";
import {Entity} from "./entity.ts";

export interface WebRenderer {
  init(): Promise<void>;
  getContext(): GPUCanvasContext;
  getCanvas(): HTMLCanvasElement;
  getDevice(): GPUDevice;
  addEntity(index: number, entity: Entity): void;
  removeEntity(index: number): void;
  createShader(shaderName: string, shaderCode: string): ShaderPackage;
  createBuffer(label: string, data: any, usage: GPUBufferUsageFlags): GPUBuffer;
  addUpdate(updater: (() => void)): void;
  run(targetFPS: number): void;
  clearFrame(): void;
}
