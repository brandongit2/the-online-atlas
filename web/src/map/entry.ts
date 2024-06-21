// define a simple shape type

import {canvasContext, device, presentationFormat} from "./webgpu";
import {Mat4} from "@/math/Mat4";
import {onFrame} from "@/utils/window-utils";

// make canvas correct size ==============

onFrame();

// define vertices =======================

// prettier-ignore
const triangleVertices = new Float32Array([
	-0.5, -0.5, 0.0,
	 0.5, -0.5, 0.0,
	 0.0,  0.5, 0.0,
]);

// send the vertex data to gpu ===========
const vertexGpuBuffer = device.createBuffer({
	label: `vertex buffer`,
	size: triangleVertices.byteLength,
	usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexGpuBuffer, 0, triangleVertices.buffer);

// set up shaders ========================

const shaders = `
	@group(0) @binding(0) var<uniform> modelMatrix: mat4x4f;

	@vertex fn vs(@builtin(instance_index) instance: u32, @location(0) vertex: vec3f) -> @builtin(position) vec4f {
		return modelMatrix * vec4f(vertex, 1.0);
	}

	@fragment fn fs() -> @location(0) vec4f {
		return vec4f(1.0, 0.0, 0.0, 1.0);
	}
`;

// set up bind groups ====================

const bindGroupLayout = device.createBindGroupLayout({
	label: `bind group layout`,
	entries: [
		{
			binding: 0,
			visibility: GPUShaderStage.VERTEX,
			buffer: {type: `uniform`},
		},
	],
});

const modelMatrix = Mat4.fromTranslation(null, 0.2, 0.2, 0.0);
const modelMatrixBuffer = new Float32Array(modelMatrix.toTuple());
const modelMatrixGpuBuffer = device.createBuffer({
	label: `model matrix buffer`,
	size: modelMatrixBuffer.byteLength,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(modelMatrixGpuBuffer, 0, modelMatrixBuffer.buffer);

const bindGroup = device.createBindGroup({
	label: `bind group`,
	layout: bindGroupLayout,
	entries: [
		{
			binding: 0,
			resource: {buffer: modelMatrixGpuBuffer},
		},
	],
});

// set up pipeline =======================

const renderPipeline = device.createRenderPipeline({
	label: `render pipeline`,
	layout: device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]}),
	vertex: {
		module: device.createShaderModule({
			label: `vertex shader`,
			code: shaders,
		}),
		entryPoint: `vs`,
		buffers: [
			{
				// `vertex`
				arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
				attributes: [{shaderLocation: 0, offset: 0, format: `float32x3`}],
			},
		],
	},
	fragment: {
		module: device.createShaderModule({
			label: `fragment shader`,
			code: shaders,
		}),
		entryPoint: `fs`,
		targets: [{format: presentationFormat}],
	},
});

// draw the triangle =====================

const encoder = device.createCommandEncoder({label: `encoder`});

const renderPassDescriptor = {
	label: `render pass`,
	colorAttachments: [
		{
			view: canvasContext.getCurrentTexture().createView({label: `colour texture view`}),
			clearValue: [0, 0, 0, 1],
			loadOp: `clear`,
			storeOp: `store`,
		},
	],
} satisfies GPURenderPassDescriptor;
const pass = encoder.beginRenderPass(renderPassDescriptor);

pass.setPipeline(renderPipeline);
pass.setBindGroup(0, bindGroup);

pass.setVertexBuffer(0, vertexGpuBuffer);
pass.draw(triangleVertices.length / 3);

pass.end();
device.queue.submit([encoder.finish()]);
