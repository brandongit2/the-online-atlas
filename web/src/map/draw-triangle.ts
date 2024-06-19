import {device, presentationFormat} from "./webgpu";

const vertexShader = `
	@vertex fn vs(@location(0) vertex: vec3f) -> @builtin(position) vec4f {
		return vec4f(vertex, 1.0);
	}
`;

const fragmentShader = `
	@fragment fn fs() -> @location(0) vec4f {
		return vec4f(1.0, 0.0, 0.0, 1.0);
	}
`;

const renderPipelineLayout = device.createPipelineLayout({
	label: `render pipeline layout`,
	bindGroupLayouts: [],
});

const pipelineDescriptor = {
	label: `render pipeline`,
	layout: renderPipelineLayout,
	vertex: {
		module: device.createShaderModule({
			label: `vertex shader`,
			code: vertexShader,
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
			code: fragmentShader,
		}),
		entryPoint: `fs`,
		targets: [{format: presentationFormat}],
	},
	primitive: {
		cullMode: `back`,
	},
	depthStencil: {
		depthWriteEnabled: true,
		depthCompare: `less`,
		format: `depth24plus`,
	},
} satisfies GPURenderPipelineDescriptor;
const pipeline = device.createRenderPipeline(pipelineDescriptor);

const vertices = [-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.0, 0.5, 0.0];
const vertexBuffer = new Float32Array(vertices);
const vertexGpuBuffer = device.createBuffer({
	label: `vertex buffer`,
	size: vertexBuffer.byteLength,
	usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexGpuBuffer, 0, vertexBuffer);

export const drawTriangle = (renderPassEncoder: GPURenderPassEncoder) => {
	renderPassEncoder.setPipeline(pipeline);
	renderPassEncoder.setVertexBuffer(0, vertexGpuBuffer);
	renderPassEncoder.draw(vertices.length / 3);
};
