import {vec3, mat3, mat4} from 'wgpu-matrix';
import shaderSource from './shaders/planet.wgsl?raw';

export async function main() {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.warn('No adapter found');
    }
    const device = await adapter?.requestDevice();
    if (!device) {
      console.warn('need a browser that supports WebGPU');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.height = 360;
    canvas.width = 360;
    document.body.append(canvas);
    const context = canvas.getContext('webgpu')!;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    const module = device.createShaderModule({
        label: 'our hardcoded red triangle shaders',
        code: shaderSource,
    });

    const pipeline = device.createRenderPipeline({
        label: 'our hardcoded red triangle pipeline',
        layout: 'auto',
        vertex: {
          entryPoint: 'vs',
          module,
        },
        fragment: {
          entryPoint: 'fs',
          module,
          targets: [{ format: presentationFormat }],
        },
      });
    const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: [0.3, 0.3, 0.3, 1],
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
    };
    function render() {
        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        renderPassDescriptor.colorAttachments[0].view =
            context.getCurrentTexture().createView();
     
        // make a command encoder to start encoding commands
        const encoder: any = device!.createCommandEncoder({ label: 'our encoder' });
     
        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.draw(6);  // call our vertex shader 3 times
        pass.end();
     
        const commandBuffer = encoder.finish();
        device!.queue.submit([commandBuffer]);
      }
     
    render();
}