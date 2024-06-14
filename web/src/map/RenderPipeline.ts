export class RenderPipeline {
	#bindGroupLayout: GPUBindGroupLayout;
	#bindGroup: GPUBindGroup;
	#pipelineLayout: GPUPipelineLayout;
	#pipeline: GPURenderPipeline;
	#colorUniformBuffer: GPUBuffer;

	constructor(device: GPUDevice) {
		this.#colorUniformBuffer = device.createBuffer({
			label: `colour uniform buffer`,
			size: 4 * Float32Array.BYTES_PER_ELEMENT,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.#bindGroupLayout = device.createBindGroupLayout({
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
		});

		this.#bindGroup = device.createBindGroup({
			label: `line bind group`,
			layout: this.#bindGroupLayout,
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

		this.#pipelineLayout = device.createPipelineLayout({
			label: `line pipeline layout`,
			bindGroupLayouts: [this.#bindGroupLayout],
		});

		this.#pipeline = device.createRenderPipeline({
			label: `line render pipeline`,
			layout: this.#pipelineLayout,
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
			primitive: {
				cullMode: `back`,
			},
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: `greater`,
				format: `depth24plus`,
			},
		});
	}
}
