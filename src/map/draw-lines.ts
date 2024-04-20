import lineShaders from "./line.wgsl?raw"
import {store} from "./store"
import {device, presentationFormat} from "./webgpu"

const colorUniformBuffer = device.createBuffer({
	label: `line colour uniform buffer`,
	size: 3 * Float32Array.BYTES_PER_ELEMENT,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

const bindGroupLayout = device.createBindGroupLayout({
	label: `line bind group layout`,
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
})

const pipelineLayout = device.createPipelineLayout({
	label: `line pipeline layout`,
	bindGroupLayouts: [bindGroupLayout],
})

const bindGroup = device.createBindGroup({
	label: `line bind group`,
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
})

const renderPipeline = device.createRenderPipeline({
	label: `line render pipeline`,
	layout: pipelineLayout,
	vertex: {
		module: device.createShaderModule({
			label: `line vertex shader`,
			code: lineShaders,
		}),
		entryPoint: `vs`,
		buffers: [
			{
				// `vertex`
				arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
				attributes: [{shaderLocation: 0, offset: 0, format: `float32x3`}],
			},
			{
				// `uv`
				arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
				attributes: [{shaderLocation: 1, offset: 0, format: `float32x2`}],
			},
		],
	},
	fragment: {
		module: device.createShaderModule({
			label: `line fragment shader`,
			code: lineShaders,
		}),
		entryPoint: `fs`,
		targets: [{format: presentationFormat}],
	},
	depthStencil: {
		depthWriteEnabled: true,
		depthCompare: `greater`,
		format: `depth24plus`,
	},
})

export const drawLines = (
	pass: GPURenderPassEncoder,
	color: Float32Array,
	data: {numIndices: number; indexGpuBuffer: GPUBuffer; vertexGpuBuffer: GPUBuffer; uvGpuBuffer: GPUBuffer},
) => {
	if (data.numIndices === 0) return

	device.queue.writeBuffer(colorUniformBuffer, 0, color)

	pass.setPipeline(renderPipeline)
	pass.setBindGroup(0, bindGroup)

	pass.setIndexBuffer(data.indexGpuBuffer, `uint32`)
	pass.setVertexBuffer(0, data.vertexGpuBuffer)
	pass.setVertexBuffer(1, data.uvGpuBuffer)
	pass.drawIndexed(data.numIndices)
}
