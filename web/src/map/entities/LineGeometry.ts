import {type Geometry} from "./Geometry";
import lineMeshGenShader from "./line-mesh-gen.wgsl?raw";
import {device} from "../webgpu";
import {Vec3} from "@/math/Vec3";

// For each input vertex, how many output vertices are generated?
const vertexSizeByClass = {
	0: 4,
	1: 6,
	2: 7,
};

export class LineGeometry implements Geometry {
	inputBuffer!: GPUBuffer;
	outputBuffer!: GPUBuffer;
	propertiesBuffer!: GPUBuffer;
	get vertexGpuBuffer() {
		return this.outputBuffer;
	}

	// Pre-allocate some `Vec3`s to avoid creating and destroying them all the time
	vs: [Vec3, Vec3, Vec3] = [new Vec3(), new Vec3(), new Vec3()];

	constructor(vertices: Vec3[][], faceNormal: Vec3, thickness: number) {
		this.setVertices(vertices, faceNormal, thickness);
	}

	setVertices(vertices: Vec3[][], faceNormal: Vec3, thickness: number) {
		const {vertexInput, outputSize} = this.preprocessVertices(vertices);
		this.writeBuffers(vertexInput, outputSize, faceNormal, thickness);
		this.generateMeshes();
	}

	private preprocessVertices(vertices: Vec3[][]) {
		// prettier-ignore
		const v0 = this.vs[0], v1 = this.vs[1], v2 = this.vs[2];

		const numVertices = vertices.reduce((sum, linestring) => sum + linestring.length, 0);
		const vertexInput = new ArrayBuffer(numVertices * 16);
		const view = new DataView(vertexInput);
		let offset = 0;
		let outputIdx = 0;

		for (const linestring of vertices) {
			let oldToNext: Vec3 | undefined;
			for (let i = 0; i < linestring.length - 1; i++) {
				const prevVertex = linestring[i - 1];
				const currentVertex = linestring[i]!;
				const nextVertex = linestring[i + 1];

				let vertexClass: 0 | 1 | 2 = 0;
				if (prevVertex && nextVertex) {
					const fromPrev = oldToNext ? v0.set(oldToNext) : Vec3.subtract(v0, currentVertex, prevVertex).normalize();
					const toNext = Vec3.subtract(v1, nextVertex, currentVertex).normalize();
					oldToNext = v2.set(toNext);

					const cornerStraightness = Vec3.dot(fromPrev, toNext);
					if (cornerStraightness < -0.7) vertexClass = 2;
					else vertexClass = 1;
				}

				view.setUint8(offset, vertexClass);
				offset += 1;

				view.setUint16(offset, (outputIdx >> 8) & 0xffff);
				view.setUint8(offset + 2, outputIdx & 0xff);
				offset += 3;

				view.setFloat32(offset, currentVertex.x);
				view.setFloat32(offset + 4, currentVertex.y);
				view.setFloat32(offset + 8, currentVertex.z);
				offset += 12;

				outputIdx += vertexSizeByClass[vertexClass];
			}
		}

		return {vertexInput, outputSize: outputIdx * 3 * Float32Array.BYTES_PER_ELEMENT};
	}

	private writeBuffers(vertexInput: ArrayBuffer, outputSize: number, faceNormal: Vec3, thickness: number) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!this.inputBuffer) {
			this.inputBuffer = device.createBuffer({
				label: `line mesh gen input buffer`,
				size: vertexInput.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});
		} else if (vertexInput.byteLength > this.inputBuffer.size) {
			this.inputBuffer.destroy();
			this.inputBuffer = device.createBuffer({
				label: `line mesh gen input buffer`,
				size: vertexInput.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});
		}
		device.queue.writeBuffer(this.inputBuffer, 0, vertexInput);

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!this.outputBuffer) {
			this.outputBuffer = device.createBuffer({
				label: `line mesh gen output buffer`,
				size: outputSize,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
			});
		} else if (outputSize > this.outputBuffer.size) {
			this.outputBuffer.destroy();
			this.outputBuffer = device.createBuffer({
				label: `line mesh gen output buffer`,
				size: outputSize,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
			});
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!this.propertiesBuffer) {
			this.propertiesBuffer = device.createBuffer({
				label: `line mesh gen properties buffer`,
				size: 4 * Float32Array.BYTES_PER_ELEMENT,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});
		}
		device.queue.writeBuffer(this.propertiesBuffer, 0, new Float32Array([...faceNormal, thickness]));
	}

	private generateMeshes() {
		const dataBindGroup = device.createBindGroup({
			layout: dataBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.inputBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: this.outputBuffer,
					},
				},
			],
		});

		const metadataBindGroup = device.createBindGroup({
			layout: metadataBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.propertiesBuffer,
					},
				},
			],
		});

		const commandEncoder = device.createCommandEncoder();
		const passEncoder = commandEncoder.beginComputePass();
		passEncoder.setPipeline(computePipeline);
		passEncoder.setBindGroup(0, dataBindGroup);
		passEncoder.setBindGroup(1, metadataBindGroup);

		const inputByteSize = 16;
		const workgroupSize = 64;
		passEncoder.dispatchWorkgroups(Math.ceil(this.inputBuffer.size / inputByteSize / workgroupSize));
	}
}

const dataBindGroupLayout = device.createBindGroupLayout({
	label: `line mesh gen data bind group layout`,
	entries: [
		{
			// `input_buffer`
			binding: 0,
			visibility: GPUShaderStage.COMPUTE,
			buffer: {
				type: `storage`,
			},
		},
		{
			// `output_buffer`
			binding: 1,
			visibility: GPUShaderStage.COMPUTE,
			buffer: {
				type: `storage`,
			},
		},
	],
});

const metadataBindGroupLayout = device.createBindGroupLayout({
	label: `line mesh gen metadata bind group layout`,
	entries: [
		{
			// `line_properties`
			binding: 0,
			visibility: GPUShaderStage.COMPUTE,
			buffer: {
				type: `storage`,
			},
		},
	],
});

const computePipelineLayout = device.createPipelineLayout({
	label: `line mesh gen compute pipeline layout`,
	bindGroupLayouts: [dataBindGroupLayout, metadataBindGroupLayout],
});

const computePipeline = device.createComputePipeline({
	label: `line mesh gen compute pipeline`,
	layout: computePipelineLayout,
	compute: {
		module: device.createShaderModule({
			label: `line mesh gen compute shader`,
			code: lineMeshGenShader,
		}),
		entryPoint: `main`,
	},
});
