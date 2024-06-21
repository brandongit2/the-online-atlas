import {type Geometry} from "./Geometry";
import {device} from "../webgpu";

export class CubeGeometry implements Geometry {
	constructor() {
		device.queue.writeBuffer(this.vertexGpuBuffer, 0, this.vertexBuffer);
		device.queue.writeBuffer(this.indexGpuBuffer, 0, this.indexBuffer);
	}

	// prettier-ignore
	vertices = [
		-0.5, -0.5, -0.5, // Rear bottom left
		0.5, -0.5, -0.5, // Rear bottom right
		0.5,  0.5, -0.5, // Rear top right
		-0.5,  0.5, -0.5, // Rear top left
		-0.5, -0.5,  0.5, // Front bottom left
		0.5, -0.5,  0.5, // Front bottom right
		0.5,  0.5,  0.5, // Front top right
		-0.5,  0.5,  0.5, // Front top left
	];
	vertexBuffer = new Float32Array(this.vertices);
	vertexGpuBuffer = device.createBuffer({
		label: `cube vertex buffer`,
		size: this.vertexBuffer.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	});

	// prettier-ignore
	indices = [
		0, 3, 1, 3, 2, 1, // Rear
		4, 5, 7, 5, 6, 7, // Front
		0, 4, 7, 0, 7, 3, // Left
		5, 1, 2, 5, 2, 6, // Right
		7, 6, 2, 7, 2, 3, // Top
		0, 5, 4, 0, 1, 5, // Bottom
	];
	indexBuffer = new Uint32Array(this.indices);
	indexGpuBuffer = device.createBuffer({
		label: `cube index buffer`,
		size: this.indexBuffer.byteLength,
		usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
	});
}
