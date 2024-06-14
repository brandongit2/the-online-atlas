export class Geometry {
	vertexBuffer: GPUBuffer;
	indexBuffer: GPUBuffer;

	constructor(device: GPUDevice, vertices: Float32Array, indices: Uint16Array) {
		this.vertexBuffer = device.createBuffer({
			size: vertices.byteLength,
			usage: GPUBufferUsage.VERTEX,
			mappedAtCreation: true,
		});
		new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
		this.vertexBuffer.unmap();

		this.indexBuffer = device.createBuffer({
			size: indices.byteLength,
			usage: GPUBufferUsage.INDEX,
			mappedAtCreation: true,
		});
		new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
		this.indexBuffer.unmap();
	}

	bind = (renderPass: GPURenderPassEncoder) => {
		renderPass.setVertexBuffer(0, this.vertexBuffer);
		renderPass.setIndexBuffer(this.indexBuffer, `uint16`);
	};
}
