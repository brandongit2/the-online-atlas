import polygonShaders from "./polygon.wgsl?raw";
import {store} from "./store";
import {device, presentationFormat} from "./webgpu";

const colorUniformBuffer = device.createBuffer({
	label: `polygon colour uniform buffer`,
	size: 3 * Float32Array.BYTES_PER_ELEMENT,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const bindGroupLayout = device.createBindGroupLayout({
	label: `polygon bind group layout`,
	entries: [
		{
			// `projectionMatrix`
			binding: 0,
			visibility: GPUShaderStage.VERTEX,
			buffer: {type: `uniform`},
		},
		{
			// `viewMatrix`
			binding: 1,
			visibility: GPUShaderStage.VERTEX,
			buffer: {type: `uniform`},
		},
		{
			// `color`
			binding: 2,
			visibility: GPUShaderStage.FRAGMENT,
			buffer: {type: `uniform`},
		},
	],
});

const pipelineLayout = device.createPipelineLayout({
	label: `polygon pipeline layout`,
	bindGroupLayouts: [bindGroupLayout],
});

const bindGroup = device.createBindGroup({
	label: `polygon bind group`,
	layout: bindGroupLayout,
	entries: [
		{
			binding: 0,
			resource: {buffer: store.projectionMatrixUniformBuffer},
		},
		{
			binding: 1,
			resource: {buffer: store.viewMatrixUniformBuffer},
		},
		{
			binding: 2,
			resource: {buffer: colorUniformBuffer},
		},
	],
});

const renderPipeline = device.createRenderPipeline({
	label: `polygon render pipeline`,
	layout: pipelineLayout,
	vertex: {
		module: device.createShaderModule({
			label: `polygon vertex shader`,
			code: polygonShaders,
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
			label: `polygon fragment shader`,
			code: polygonShaders,
		}),
		entryPoint: `fs`,
		targets: [{format: presentationFormat}],
	},
	primitive: {
		cullMode: `back`,
	},
	depthStencil: {
		depthWriteEnabled: true,
		depthCompare: `greater`,
		format: `depth24plus`,
	},
});

export const drawPolygons = (
	pass: GPURenderPassEncoder,
	color: Float32Array,
	data: {numIndices: number; indexGpuBuffer: GPUBuffer; vertexGpuBuffer: GPUBuffer},
) => {
	if (data.numIndices === 0) return;

	device.queue.writeBuffer(colorUniformBuffer, 0, color);

	pass.setPipeline(renderPipeline);
	pass.setBindGroup(0, bindGroup);

	pass.setIndexBuffer(data.indexGpuBuffer, `uint32`);
	pass.setVertexBuffer(0, data.vertexGpuBuffer);
	pass.drawIndexed(data.numIndices);
};
