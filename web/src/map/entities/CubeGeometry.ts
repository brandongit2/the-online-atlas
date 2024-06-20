import {Geometry} from "./Geometry";
import {device} from "../webgpu";
import {Mat4} from "@/math/Mat4";

export class CubeGeometry extends Geometry {
	indexGpuBuffer = indexGpuBuffer;
	vertexGpuBuffer = vertexGpuBuffer;

	modelMatrix = new Mat4();
}

// prettier-ignore
const vertices = [
	-0.5, -0.5, -0.5, // Rear bottom left
	 0.5, -0.5, -0.5, // Rear bottom right
	 0.5,  0.5, -0.5, // Rear top right
	-0.5,  0.5, -0.5, // Rear top left
	-0.5, -0.5,  0.5, // Front bottom left
	 0.5, -0.5,  0.5, // Front bottom right
	 0.5,  0.5,  0.5, // Front top right
	-0.5,  0.5,  0.5, // Front top left
];
const vertexBuffer = new Float32Array(vertices);
const vertexGpuBuffer = device.createBuffer({
	label: `vertex buffer`,
	size: vertexBuffer.byteLength,
	usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexGpuBuffer, 0, vertexBuffer);

// prettier-ignore
const indices = [
	0, 3, 1, 3, 2, 1, // Rear
	4, 5, 7, 5, 6, 7, // Front
	0, 4, 7, 0, 7, 3, // Left
	5, 1, 2, 5, 2, 6, // Right
	7, 6, 2, 7, 2, 3, // Top
	0, 5, 4, 0, 1, 5, // Bottom
];
const indexBuffer = new Uint16Array(indices);
const indexGpuBuffer = device.createBuffer({
	label: `index buffer`,
	size: indexBuffer.byteLength,
	usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(indexGpuBuffer, 0, indexBuffer);
